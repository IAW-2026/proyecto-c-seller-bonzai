import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrServiceKey(req);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    const where: Record<string, unknown> = {};
    if (from || to) {
      const dateFilter: Record<string, string | Date> = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");
      where.createdAt = dateFilter;
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          orders: {
            include: { items: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    const sellerIds = [...new Set(purchases.flatMap((p) => p.orders.map((o) => o.sellerId)))];
    const sellers = await prisma.sellerProfile.findMany({
      where: { clerkId: { in: sellerIds } },
      select: { clerkId: true, email: true },
    });
    const sellerEmailMap = new Map(sellers.map((s) => [s.clerkId, s.email]));

    const purchasesWithSellerEmail = purchases.map((p) => ({
      ...p,
      orders: p.orders.map((o) => ({
        ...o,
        sellerEmail: sellerEmailMap.get(o.sellerId) || null,
      })),
    }));

    return NextResponse.json({ purchases: purchasesWithSellerEmail, total, page, limit });
  } catch (error: any) {
    console.error("[admin/purchases]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
