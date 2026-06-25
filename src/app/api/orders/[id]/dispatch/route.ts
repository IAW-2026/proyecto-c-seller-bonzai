import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    if (order.status !== "AWAITING_TRACKING") {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: "Order must be in AWAITING_TRACKING to confirm dispatch." },
        { status: 409 }
      );
    }

    if (body.action === "confirm_dispatch") {
      return NextResponse.json({ success: true, orderId: id, message: "Dispatch confirmed." });
    }

    if (body.action === "update_tracking") {
      if (!body.trackingId || typeof body.trackingId !== "string") {
        return NextResponse.json(
          { error: "INVALID_REQUEST", message: "trackingId is required." },
          { status: 400 }
        );
      }

      await prisma.order.update({
        where: { id, status: "AWAITING_TRACKING" },
        data: { status: "SHIPPED", trackingId: body.trackingId, shippedAt: new Date() },
      });

      return NextResponse.json({ success: true, orderId: id, newStatus: "SHIPPED" });
    }

    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Unknown action. Supported: confirm_dispatch, update_tracking." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[orders/dispatch]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
