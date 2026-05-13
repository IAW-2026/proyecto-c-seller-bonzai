import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { status: { contains: search.toUpperCase() } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({ orders, totalRevenue, total });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching orders." },
      { status: 500 }
    );
  }
}
