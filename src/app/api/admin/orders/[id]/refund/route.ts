import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../../lib/auth-helpers";
import { OrderStatus } from "@prisma/client";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(req);

    const { id } = await context.params;
    const body = await req.json();
    const reason = body.reason || "Refunded by admin";

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "ALREADY_CANCELLED", message: "Order is already cancelled." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true, orderId: id, newStatus: "CANCELLED" });
  } catch (error: any) {
    console.error("[admin/orders/refund]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
