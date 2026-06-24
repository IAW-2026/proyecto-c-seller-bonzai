import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("x-service-key") !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10", 10));
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "AWAITING_TRACKING", "SHIPPED"] },
        ...(from || to ? { paidAt: dateFilter } : {}),
      },
      select: { sellerId: true, total: true },
    });

    const sellers = await prisma.sellerProfile.findMany({
      select: { clerkId: true, email: true },
    });
    const sellerEmailMap = new Map(sellers.map((s) => [s.clerkId, s.email]));

    const sellerMap = new Map<string, { email: string; revenue: number; orderCount: number }>();

    for (const order of orders) {
      const current = sellerMap.get(order.sellerId) || {
        email: sellerEmailMap.get(order.sellerId) || "Unknown",
        revenue: 0,
        orderCount: 0,
      };
      current.revenue += order.total;
      current.orderCount += 1;
      sellerMap.set(order.sellerId, current);
    }

    const topSellers = Array.from(sellerMap.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(([sellerId, data]) => ({ sellerId, ...data }));

    return NextResponse.json({ topSellers });
  } catch (err) {
    console.error("[admin/analytics/sellers/top]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
