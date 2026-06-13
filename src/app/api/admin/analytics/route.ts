import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function getServiceKey(req: NextRequest): boolean {
  return req.headers.get("x-service-key") === process.env.SERVICE_API_KEY;
}

export async function GET(req: NextRequest) {
  try {
    if (!getServiceKey(req)) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
    }

    const sellers = await prisma.sellerProfile.count();
    const products = await prisma.product.count();
    const activeProducts = await prisma.product.count({ where: { isActive: true, suspended: false } });
    const orders = await prisma.order.count();
    const reviews = await prisma.sellerReview.count();
    const reservations = await prisma.reservation.count();
    const activeReservations = await prisma.reservation.count({ where: { status: "ACTIVE" } });
    const purchases = await prisma.purchase.count();

    const paidOrders = await prisma.order.findMany({
      where: { status: { in: ["PAID", "AWAITING_TRACKING", "SHIPPED"] } },
      select: { total: true },
    });
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const ratingResult = await prisma.sellerReview.aggregate({
      _avg: { rating: true },
    });
    const avgRating = ratingResult._avg.rating || 0;

    const cancelledOrders = await prisma.order.count({ where: { status: "CANCELLED" } });
    const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });
    const shippedOrders = await prisma.order.count({ where: { status: "SHIPPED" } });

    return NextResponse.json({
      overview: {
        totalSellers: sellers,
        totalProducts: products,
        activeProducts,
        totalOrders: orders,
        pendingOrders,
        cancelledOrders,
        shippedOrders,
        totalRevenue,
        averageRating: Math.round(avgRating * 100) / 100,
        totalReviews: reviews,
        totalReservations: reservations,
        activeReservations,
        totalPurchases: purchases,
      },
    });
  } catch (err) {
    console.error("[admin/analytics/overview]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
