import { NextResponse } from "next/server";
import * as reservationService from "../../../../services/reservationService";
import { getSellerId } from "../../../../lib/auth-helpers";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    const isService = serviceKey === process.env.SERVICE_API_KEY;
    if (!isService) {
      try {
        await getSellerId();
      } catch (err) {
        console.error("[reservations DELETE auth]", err);
        return NextResponse.json(
          { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
          { status: 401 }
        );
      }
    }

    const { id } = await context.params;

    const result = await reservationService.cancelReservation(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[reservations DELETE]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
