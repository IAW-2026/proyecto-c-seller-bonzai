import { NextResponse } from "next/server";
import { createOrderSchema } from "../../../../validators";
import * as orderService from "../../../../services/orderService";

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
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Faltan campos obligatorios o el formato de la orden es inválido." },
        { status: 400 }
      );
    }

    const { orderId, buyerId, reservationIds, status, shippingName, shippingLastName, shippingAddress, shippingCity, shippingProvince, shippingZip, shippingPhone } = parsed.data;

    const result = await orderService.createOrder(orderId, buyerId, reservationIds, status, {
      shippingName,
      shippingLastName,
      shippingAddress,
      shippingCity,
      shippingProvince,
      shippingZip,
      shippingPhone,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, orderIds: result.orderIds },
      { status: 201 }
    );
  } catch (err) {
    console.error("[orders/new]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
