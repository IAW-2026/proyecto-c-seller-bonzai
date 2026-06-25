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
      include: { items: true },
    });

    const productMap = new Map<string, { name: string; quantity: number; revenue: number; orderCount: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        const current = productMap.get(item.productId) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
          orderCount: 0,
        };
        current.quantity += item.quantity;
        current.revenue += item.subtotal;
        current.orderCount += 1;
        productMap.set(item.productId, current);
      }
    }

    const topByRevenue = Array.from(productMap.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, limit)
      .map(([productId, data]) => ({ productId, ...data }));

    const topByQuantity = Array.from(productMap.entries())
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, limit)
      .map(([productId, data]) => ({ productId, ...data }));

    return NextResponse.json({ topByRevenue, topByQuantity });
  } catch (err) {
    console.error("[admin/analytics/products/top]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
