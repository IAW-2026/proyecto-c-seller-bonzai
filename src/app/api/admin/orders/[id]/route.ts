import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../lib/auth-helpers";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(_req);

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        purchase: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { clerkId: order.sellerId },
      select: { email: true },
    });

    return NextResponse.json({ order: { ...order, sellerEmail: seller?.email || null } });
  } catch (error: any) {
    console.error("[admin/orders GET]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
