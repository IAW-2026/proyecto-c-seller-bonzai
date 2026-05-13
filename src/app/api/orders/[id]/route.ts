import { NextResponse } from "next/server";
import * as orderService from "../../../../services/orderService";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.action === "ship") {
      if (!body.trackingId) {
        return NextResponse.json(
          { error: "INVALID_REQUEST", message: "trackingId is required." },
          { status: 400 }
        );
      }

      const result = await orderService.shipOrder(id, body.trackingId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.status }
        );
      }

      return NextResponse.json({ success: true, orderId: result.orderId, newStatus: result.newStatus });
    }

    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Unknown action." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await orderService.cancelOrder(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
