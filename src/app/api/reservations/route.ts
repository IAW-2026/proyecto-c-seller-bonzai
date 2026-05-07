import { NextResponse } from "next/server";
import { createReservationSchema } from "../../../validators";
import * as reservationService from "../../../services/reservationService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "La cantidad debe ser mayor a cero y orderId es obligatorio." },
        { status: 400 }
      );
    }

    const { productId, quantity, orderId, buyerId } = parsed.data;

    if (!buyerId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "buyerId es obligatorio." },
        { status: 400 }
      );
    }

    const result = await reservationService.createReservation(productId, quantity, orderId, buyerId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(
      { success: true, reservationId: result.reservationId, expiresAt: result.expiresAt },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
