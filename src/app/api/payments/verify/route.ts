import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = req.nextUrl;
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "orderId is required." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        transactionId: true,
        purchaseId: true,
        paidAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      isPaid: order.status === "PAID" || order.status === "AWAITING_TRACKING" || order.status === "SHIPPED",
      transactionId: order.transactionId,
      purchaseId: order.purchaseId,
      paidAt: order.paidAt?.toISOString() || null,
    });
  } catch (err) {
    console.error("[payments/verify]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
