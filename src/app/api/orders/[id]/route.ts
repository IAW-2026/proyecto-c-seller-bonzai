import { NextResponse } from "next/server";
import * as orderService from "../../../../services/orderService";
import { getSellerId } from "../../../../lib/auth-helpers";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getSellerId();

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
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "SELLER_NOT_FOUND") {
      return NextResponse.json({ error: "SELLER_NOT_FOUND", message: "No existe un perfil de vendedor para esta cuenta." }, { status: 404 });
    }
    if (error.message === "SELLER_SUSPENDED") {
      return NextResponse.json({ error: "SELLER_SUSPENDED", message: "Tu cuenta de vendedor está suspendida." }, { status: 403 });
    }
    if (error.message === "SELLER_NOT_APPROVED") {
      return NextResponse.json({ error: "SELLER_NOT_APPROVED", message: "Tu cuenta de vendedor aún no ha sido aprobada." }, { status: 403 });
    }
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
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

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
