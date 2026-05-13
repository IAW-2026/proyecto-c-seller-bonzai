import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

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

    const sellerIds = [...new Set(orders.map((o) => o.sellerId))];
    const sellers = await prisma.sellerProfile.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, email: true },
    });
    const sellerEmailMap = new Map(sellers.map((s) => [s.id, s.email]));

    const ordersWithEmail = orders.map((o) => ({
      ...o,
      sellerEmail: sellerEmailMap.get(o.sellerId) || null,
    }));

    const totalRevenue = orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({ orders: ordersWithEmail, totalRevenue, total });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching orders." },
      { status: 500 }
    );
  }
}
