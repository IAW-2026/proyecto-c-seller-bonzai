import { NextResponse } from "next/server";
import * as orderService from "../../../../services/orderService";

export async function GET(req: Request) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");

    if (!buyerId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "buyerId es requerido." },
        { status: 400 }
      );
    }

    const result = await orderService.getOrdersByBuyer(buyerId);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
