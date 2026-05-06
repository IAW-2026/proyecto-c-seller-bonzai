import { NextResponse } from "next/server";
import * as reservationService from "../../../../services/reservationService";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await reservationService.cancelReservation(id);

    if (result) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
