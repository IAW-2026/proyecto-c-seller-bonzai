import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../../lib/auth-helpers";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(req);

    const { id } = await context.params;
    const body = await req.json();
    const { status } = body;

    if (!status || !["PENDING", "PAID", "AWAITING_TRACKING", "SHIPPED", "CANCELLED"].includes(status)) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "Invalid status. Must be one of: PENDING, PAID, AWAITING_TRACKING, SHIPPED, CANCELLED." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status: status as OrderStatus };
    if (status === "PAID") updateData.paidAt = new Date();
    if (status === "AWAITING_TRACKING") updateData.awaitingTrackingAt = new Date();
    if (status === "SHIPPED") updateData.shippedAt = new Date();
    if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = body.reason || "Admin override";
    }

    await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, orderId: id, newStatus: status });
  } catch (error: any) {
    console.error("[admin/orders/status PATCH]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
