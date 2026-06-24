import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../lib/auth-helpers";

export async function GET(
  _req: Request,
  context: { params: Promise<{ clerkId: string }> }
) {
  try {
    await requireAdminOrServiceKey(_req);

    const { clerkId } = await context.params;

    const seller = await prisma.sellerProfile.findUnique({
      where: { clerkId },
    });

    if (!seller) {
      return NextResponse.json({ error: "SELLER_NOT_FOUND", message: "Seller not found." }, { status: 404 });
    }

    const [products, orders, review] = await Promise.all([
      prisma.product.findMany({
        where: { sellerId: seller.clerkId },
        orderBy: { createdAt: "desc" },
        include: { category: true },
      }),
      prisma.order.findMany({
        where: { sellerId: seller.clerkId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sellerReview.findUnique({
        where: { sellerId: seller.id },
      }),
    ]);

    const totalRevenue = orders
      .filter((o) => o.status === "PAID" || o.status === "AWAITING_TRACKING" || o.status === "SHIPPED")
      .reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({
      user: {
        id: seller.id,
        clerkId: seller.clerkId,
        email: seller.email,
        approved: seller.approved,
        suspended: seller.suspended,
        createdAt: seller.createdAt.toISOString(),
      },
      activity: {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue,
        products,
        orders: orders.map((o) => ({
          id: o.id,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt.toISOString(),
          itemCount: o.items.length,
        })),
        review: review || null,
      },
    });
  } catch (error: any) {
    console.error("[admin/users GET]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
