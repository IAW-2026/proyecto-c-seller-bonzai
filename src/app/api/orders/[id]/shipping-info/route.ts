import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      buyerId: order.buyerId,
      status: order.status,
      total: order.total,
      shipping: {
        name: `${order.shippingName || ""} ${order.shippingLastName || ""}`.trim(),
        address: order.shippingAddress,
        city: order.shippingCity,
        province: order.shippingProvince,
        zip: order.shippingZip,
        phone: order.shippingPhone,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      trackingId: order.trackingId,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("[orders/shipping-info]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
