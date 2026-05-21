import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth-helpers";

export async function GET() {
  try {
    await requireAdmin();

    const [products, orders, categories, sellers] = await Promise.all([
      prisma.product.findMany(),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany(),
      prisma.sellerProfile.findMany(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalSellers = sellers.length;
    const paidOrShipped = orders.filter((o) => o.status === "PAID" || o.status === "AWAITING_TRACKING" || o.status === "SHIPPED");
    const totalRevenue = paidOrShipped.reduce((sum, o) => sum + o.total, 0);
    const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length;
    const shippedOrdersCount = orders.filter((o) => o.status === "SHIPPED").length;
    const cancelledOrdersCount = orders.filter((o) => o.status === "CANCELLED").length;

    const totalStock = products.reduce((s, p) => s + p.stock, 0);
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const moderatedProducts = products.filter((p) => p.moderationStatus !== "ACTIVE").length;

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

    const sellerRevenue = new Map<string, { email: string; revenue: number; orders: number }>();
    for (const order of orders) {
      if (order.status === "PAID" || order.status === "AWAITING_TRACKING" || order.status === "SHIPPED") {
        const seller = sellers.find((s) => s.id === order.sellerId);
        const email = seller?.email || "Unknown";
        const current = sellerRevenue.get(order.sellerId) || { email, revenue: 0, orders: 0 };
        current.revenue += order.total;
        current.orders += 1;
        sellerRevenue.set(order.sellerId, current);
      }
    }
    const topSellers = Array.from(sellerRevenue.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([, data]) => data);

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
        totalSellers,
        totalProducts,
        totalOrders,
        totalRevenue,
        pendingOrders: pendingOrdersCount,
        shippedOrders: shippedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        totalStock,
        outOfStock,
        moderatedProducts,
      },
      monthlyRevenue,
      monthlyOrders,
      topCategories,
      revenueTrend,
      topSellers,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
