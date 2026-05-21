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

    const { orderId, buyerId, reservationIds, status } = parsed.data;

    const result = await orderService.createOrder(orderId, buyerId, reservationIds, status);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, orderId: result.orderId },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
