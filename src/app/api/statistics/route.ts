import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { getSellerId } from "../../../lib/auth-helpers";

export async function GET() {
  try {
    const sellerId = await getSellerId();

    const [products, orders, categories] = await Promise.all([
      prisma.product.findMany({ where: { sellerId } }),
      prisma.order.findMany({
        where: { sellerId },
        include: { items: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const paidOrShipped = orders.filter((o) => o.status === "PAID" || o.status === "AWAITING_TRACKING" || o.status === "SHIPPED");
    const totalRevenue = paidOrShipped.reduce((sum, o) => sum + o.total, 0);
    const paidOrders = orders.filter((o) => o.status === "PAID").length;
    const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
    const shippedOrders = orders.filter((o) => o.status === "SHIPPED").length;
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;

    // Monthly revenue (paid + shipped orders)
    const monthlyMap = new Map<string, number>();
    const monthlyOrderMap = new Map<string, number>();
    for (const order of orders) {
      const month = order.createdAt.toISOString().slice(0, 7);
      monthlyOrderMap.set(month, (monthlyOrderMap.get(month) || 0) + 1);
      if (order.status === "PAID" || order.status === "AWAITING_TRACKING" || order.status === "SHIPPED") {
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + order.total);
      }
    }
    const monthlyRevenue = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
    const monthlyOrders = Array.from(monthlyOrderMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, orders: count }));

    // Top categories by revenue and quantity sold
    const categoryRevenue = new Map<string, number>();
    const categoryCount = new Map<string, number>();
    for (const order of orders) {
      if (order.status === "PAID" || order.status === "AWAITING_TRACKING" || order.status === "SHIPPED") {
        for (const item of order.items) {
          const product = products.find((p) => p.id === item.productId);
          const catName = product?.categoryId
            ? categoryMap.get(product.categoryId) || "Uncategorized"
            : "Uncategorized";
          categoryRevenue.set(catName, (categoryRevenue.get(catName) || 0) + item.subtotal);
          categoryCount.set(catName, (categoryCount.get(catName) || 0) + item.quantity);
        }
      }
    }
    const topCategories = Array.from(categoryRevenue.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, revenue]) => ({
        name,
        revenue,
        count: categoryCount.get(name) || 0,
      }));

    // Recent months for trend (last 6)
    const now = new Date();
    const recentMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      recentMonths.push(d.toISOString().slice(0, 7));
    }

    const revenueTrend = recentMonths.map((m) => ({
      month: m,
      revenue: monthlyMap.get(m) || 0,
      orders: monthlyOrderMap.get(m) || 0,
    }));

    return NextResponse.json({
      summary: {
        totalProducts,
        totalOrders,
        totalRevenue,
        paidOrders,
        pendingOrders,
        shippedOrders,
        cancelledOrders,
        totalStock: products.reduce((s, p) => s + p.stock, 0),
      },
      monthlyRevenue,
      monthlyOrders,
      topCategories,
      revenueTrend,
    });
  } catch (error: any) {
    console.error("[statistics]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
    }
    if (error.message === "SELLER_NOT_FOUND") {
      return NextResponse.json({ error: "SELLER_NOT_FOUND", message: "Perfil de vendedor no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
