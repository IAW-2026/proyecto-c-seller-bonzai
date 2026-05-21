import { NextResponse } from "next/server";
import * as orderService from "../../../../../services/orderService";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    if (!body.trackingId || typeof body.trackingId !== "string") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "trackingId es obligatorio." },
        { status: 400 }
      );
    }

    const result = await orderService.submitTracking(id, body.trackingId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, orderId: result.orderId, newStatus: result.newStatus });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
