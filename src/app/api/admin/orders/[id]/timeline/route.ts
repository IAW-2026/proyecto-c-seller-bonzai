import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../../lib/auth-helpers";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(req);

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        buyerId: true,
        status: true,
        createdAt: true,
        paidAt: true,
        awaitingTrackingAt: true,
        shippedAt: true,
        cancelledAt: true,
        cancellationReason: true,
        trackingId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    const events: { status: string; timestamp: string; detail?: string }[] = [];

    events.push({ status: "PENDING", timestamp: order.createdAt.toISOString(), detail: "Order created" });

    if (order.paidAt) {
      events.push({ status: "PAID", timestamp: order.paidAt.toISOString(), detail: "Payment confirmed" });
    }

    if (order.awaitingTrackingAt) {
      events.push({ status: "AWAITING_TRACKING", timestamp: order.awaitingTrackingAt.toISOString(), detail: "Awaiting tracking number" });
    }

    if (order.shippedAt) {
      events.push({ status: "SHIPPED", timestamp: order.shippedAt.toISOString(), detail: `Shipped — tracking: ${order.trackingId || "N/A"}` });
    }

    if (order.cancelledAt) {
      events.push({ status: "CANCELLED", timestamp: order.cancelledAt.toISOString(), detail: order.cancellationReason ? `Cancelled: ${order.cancellationReason}` : "Cancelled" });
    }

    return NextResponse.json({ orderId: order.id, currentStatus: order.status, events });
  } catch (err: any) {
    console.error("[admin/orders/timeline]", err);
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
