import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      suspended: false,
      moderationStatus: "ACTIVE" as const,
      seller: {
        approved: true,
        suspended: false,
      },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            select: { id: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (err) {
    console.error("[products/browse]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
