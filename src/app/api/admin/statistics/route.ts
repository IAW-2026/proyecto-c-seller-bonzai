import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requireAdminOrServiceKey(req);

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const orderDateFilter: Record<string, Date> = {};
    if (from) orderDateFilter.gte = new Date(from);
    if (to) orderDateFilter.lte = new Date(to + "T23:59:59.999Z");
    const orderWhere = from || to ? { createdAt: orderDateFilter } : {};

    const reserveDateFilter: Record<string, Date> = {};
    if (from) reserveDateFilter.gte = new Date(from);
    if (to) reserveDateFilter.lte = new Date(to + "T23:59:59.999Z");
    const reserveWhere = from || to ? { createdAt: reserveDateFilter } : {};

    const reviewDateFilter: Record<string, Date> = {};
    if (from) reviewDateFilter.gte = new Date(from);
    if (to) reviewDateFilter.lte = new Date(to + "T23:59:59.999Z");
    const reviewWhere = from || to ? { createdAt: reviewDateFilter } : {};

    const productDateFilter: Record<string, Date> = {};
    if (from) productDateFilter.gte = new Date(from);
    if (to) productDateFilter.lte = new Date(to + "T23:59:59.999Z");
    const productWhere = from || to ? { createdAt: productDateFilter } : {};

    const sellerDateFilter: Record<string, Date> = {};
    if (from) sellerDateFilter.gte = new Date(from);
    if (to) sellerDateFilter.lte = new Date(to + "T23:59:59.999Z");
    const sellerWhere = from || to ? { createdAt: sellerDateFilter } : {};

    const [products, orders, categories, sellers] = await Promise.all([
      prisma.product.findMany({ where: productWhere }),
      prisma.order.findMany({
        where: orderWhere,
        include: { items: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany(),
      prisma.sellerProfile.findMany({ where: sellerWhere }),
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
        const seller = sellers.find((s) => s.clerkId === order.sellerId);
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

    const uniqueBuyers = new Set(orders.map((o) => o.buyerId)).size;

    const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();
    for (const order of orders) {
      if (order.status === "PAID" || order.status === "AWAITING_TRACKING" || order.status === "SHIPPED") {
        for (const item of order.items) {
          const current = productRevenue.get(item.productId) || { name: item.productName, revenue: 0, quantity: 0 };
          current.revenue += item.subtotal;
          current.quantity += item.quantity;
          productRevenue.set(item.productId, current);
        }
      }
    }
    const topProducts = Array.from(productRevenue.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([productId, data]) => ({ productId, ...data }));

    const reservations = await prisma.reservation.findMany({ where: reserveWhere });
    const totalReservations = reservations.length;
    const completedReservations = reservations.filter((r) => r.status === "COMPLETED").length;
    const reservationConversionRate = totalReservations > 0 ? Math.round((completedReservations / totalReservations) * 10000) / 100 : 0;

    const ratingResult = await prisma.sellerReview.aggregate({
      where: reviewWhere,
      _avg: { rating: true },
      _count: true,
    });
    const averageRating = Math.round((ratingResult._avg.rating || 0) * 100) / 100;

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
        uniqueBuyers,
        totalReservations,
        reservationConversionRate,
        averageRating,
        totalReviews: ratingResult._count,
      },
      monthlyRevenue,
      monthlyOrders,
      topCategories,
      revenueTrend,
      topSellers,
      topProducts,
    });
  } catch (error: any) {
    console.error("[admin/statistics]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
