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

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const where = from || to ? { createdAt: dateFilter } : {};

    const [total, active, completed, cancelled, expired] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.reservation.count({ where: { ...where, status: "COMPLETED" } }),
      prisma.reservation.count({ where: { ...where, status: "CANCELLED" } }),
      prisma.reservation.count({ where: { ...where, status: "EXPIRED" } }),
    ]);

    const conversionRate = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;

    return NextResponse.json({
      metrics: {
        total,
        active,
        completed,
        cancelled,
        expired,
        conversionRate,
      },
    });
  } catch (err) {
    console.error("[admin/analytics/reservations]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
