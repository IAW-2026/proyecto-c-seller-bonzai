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

    const [categories, products, orders] = await Promise.all([
      prisma.category.findMany(),
      prisma.product.findMany({ select: { id: true, categoryId: true } }),
      prisma.order.findMany({
        where: {
          status: { in: ["PAID", "AWAITING_TRACKING", "SHIPPED"] },
          ...(from || to ? { paidAt: dateFilter } : {}),
        },
        include: { items: true },
      }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const productCategoryMap = new Map(products.map((p) => [p.id, p.categoryId]));

    const catData = new Map<string, { name: string; revenue: number; quantity: number; orderCount: number }>();

    for (const order of orders) {
      for (const item of order.items) {
        const catId = productCategoryMap.get(item.productId);
        const catName = catId ? categoryMap.get(catId) || "Uncategorized" : "Uncategorized";
        const current = catData.get(catName) || { name: catName, revenue: 0, quantity: 0, orderCount: 0 };
        current.revenue += item.subtotal;
        current.quantity += item.quantity;
        current.orderCount += 1;
        catData.set(catName, current);
      }
    }

    const categoriesBreakdown = Array.from(catData.entries())
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .map(([, data]) => data);

    return NextResponse.json({ categories: categoriesBreakdown });
  } catch (err) {
    console.error("[admin/analytics/categories]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
