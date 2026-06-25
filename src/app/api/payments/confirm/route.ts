import { NextResponse } from "next/server";
import { confirmPaymentSchema } from "../../../../validators";
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
    const parsed = confirmPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "buyerId, orderIds y transactionId son obligatorios." },
        { status: 400 }
      );
    }

    const { buyerId, orderIds, transactionId, paidAt } = parsed.data;

    const result = await orderService.confirmPayment(buyerId, orderIds, transactionId, paidAt);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      purchaseId: result.purchaseId,
      updatedCount: result.updatedCount,
    });
  } catch (err) {
    console.error("[payments/confirm]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
