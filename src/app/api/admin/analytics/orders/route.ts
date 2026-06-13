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
    const groupBy = searchParams.get("groupBy") || "month";

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const orders = await prisma.order.findMany({
      where: from || to ? { createdAt: dateFilter } : {},
      select: { status: true, createdAt: true },
    });

    const groupMap = new Map<string, { total: number; pending: number; paid: number; awaiting: number; shipped: number; cancelled: number }>();

    for (const order of orders) {
      const date = order.createdAt;
      let key: string;
      if (groupBy === "day") {
        key = date.toISOString().slice(0, 10);
      } else if (groupBy === "week") {
        const d = new Date(date);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
      } else {
        key = date.toISOString().slice(0, 7);
      }

      const current = groupMap.get(key) || { total: 0, pending: 0, paid: 0, awaiting: 0, shipped: 0, cancelled: 0 };
      current.total += 1;
      if (order.status === "PENDING") current.pending += 1;
      else if (order.status === "PAID") current.paid += 1;
      else if (order.status === "AWAITING_TRACKING") current.awaiting += 1;
      else if (order.status === "SHIPPED") current.shipped += 1;
      else if (order.status === "CANCELLED") current.cancelled += 1;
      groupMap.set(key, current);
    }

    const ordersByPeriod = Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data }));

    return NextResponse.json({ orders: ordersByPeriod, groupBy, from: from || null, to: to || null });
  } catch (err) {
    console.error("[admin/analytics/orders]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
