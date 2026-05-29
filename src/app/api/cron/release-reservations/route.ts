import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservationsInBatch } from "../../../../repositories/reservationRepository";

export async function POST(req: NextRequest) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json({ error: "FORBIDDEN", message: "Service key inválida." }, { status: 403 });
    }

    const released = await releaseExpiredReservationsInBatch();

    return NextResponse.json({ success: true, released });
  } catch (err) {
    console.error("[cron/release-reservations]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
