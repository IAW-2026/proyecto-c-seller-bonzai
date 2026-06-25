import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get("x-service-key") !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const interval = searchParams.get("interval") || "month";

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PAID", "AWAITING_TRACKING", "SHIPPED"] },
        ...(from || to ? { paidAt: dateFilter } : {}),
      },
      select: { total: true, paidAt: true, createdAt: true },
    });

    const groupMap = new Map<string, { revenue: number; count: number }>();

    for (const order of orders) {
      const date = order.paidAt || order.createdAt;
      let key: string;
      if (interval === "day") {
        key = date.toISOString().slice(0, 10);
      } else if (interval === "week") {
        const d = new Date(date);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
      } else {
        key = date.toISOString().slice(0, 7);
      }

      const current = groupMap.get(key) || { revenue: 0, count: 0 };
      current.revenue += order.total;
      current.count += 1;
      groupMap.set(key, current);
    }

    const revenue = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.count,
      }));

    return NextResponse.json({ revenue, interval, from: from || null, to: to || null });
  } catch (err) {
    console.error("[admin/analytics/revenue]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
