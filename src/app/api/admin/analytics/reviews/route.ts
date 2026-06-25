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

    const [reviews, ratingResult] = await Promise.all([
      prisma.sellerReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellerReview.aggregate({
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    const distribution = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating - 1] += 1;
      }
    }

    return NextResponse.json({
      metrics: {
        total: ratingResult._count,
        averageRating: Math.round((ratingResult._avg.rating || 0) * 100) / 100,
        distribution: {
          "1": distribution[0],
          "2": distribution[1],
          "3": distribution[2],
          "4": distribution[3],
          "5": distribution[4],
        },
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[admin/analytics/reviews]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
