import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderIds, reason } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "orderIds array is required." },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: { items: true },
    });

    const notFound = orderIds.filter((id: string) => !orders.find((o) => o.id === id));
    if (notFound.length > 0) {
      return NextResponse.json(
        { error: "ORDER_NOT_FOUND", message: `Orders not found: ${notFound.join(", ")}` },
        { status: 404 }
      );
    }

    const invalidStatus = orders.filter((o) => o.status !== "PAID" && o.status !== "PENDING");
    if (invalidStatus.length > 0) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: `Orders not refundable (must be PAID or PENDING): ${invalidStatus.map((o) => o.id).join(", ")}` },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            cancellationReason: reason || "Refunded by Payments App",
            cancelledAt: new Date(),
          },
        });
      }

      return { refundedCount: orders.length };
    });

    return NextResponse.json({
      success: true,
      refundedCount: result.refundedCount,
    });
  } catch (err) {
    console.error("[payments/refund]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
