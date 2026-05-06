import { NextResponse } from "next/server";
import { confirmPaymentSchema } from "../../../../../validators";
import * as orderService from "../../../../../services/orderService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parsed = confirmPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "transactionId es obligatorio." },
        { status: 400 }
      );
    }

    const { transactionId, paidAt } = parsed.data;

    const result = await orderService.confirmPayment(id, transactionId, paidAt);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      newStatus: result.newStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
