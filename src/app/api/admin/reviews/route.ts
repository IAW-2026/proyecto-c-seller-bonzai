import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrServiceKey(req);

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const rating = searchParams.get("rating") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (rating) {
      where.rating = parseInt(rating, 10);
    }

    const [reviews, total] = await Promise.all([
      prisma.sellerReview.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { seller: { select: { id: true, email: true } } },
      }),
      prisma.sellerReview.count({ where }),
    ]);

    return NextResponse.json({ reviews, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("[admin/reviews]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
