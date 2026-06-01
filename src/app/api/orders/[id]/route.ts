import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import * as orderService from "../../../../services/orderService";
import { getSellerId } from "../../../../lib/auth-helpers";
import { cancelOrderSchema } from "../../../../validators/order-cancel";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    const isService = serviceKey === process.env.SERVICE_API_KEY;

    let sellerId: string | undefined;
    if (!isService) {
      try {
        sellerId = await getSellerId();
      } catch {
        return NextResponse.json({ error: "UNAUTHORIZED", message: "Acceso no autorizado." }, { status: 401 });
      }
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "La orden no existe." }, { status: 404 });
    }

    if (!isService && order.sellerId !== sellerId) {
      return NextResponse.json({ error: "FORBIDDEN", message: "No tenés permisos sobre esta orden." }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("[orders GET]", error);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await getSellerId();

    const { id } = await context.params;
    const body = await req.json();

    if (body.action === "ship") {
      const result = await orderService.shipOrder(id);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.status }
        );
      }

      // Fire-and-forget: notify the shipping app without blocking
      const { clerkToken, transactionId, buyerId, sellerClerkId, deliveryAddress, type } = body;
      if (clerkToken && transactionId && buyerId && deliveryAddress) {
        console.error("[orders PATCH] calling shipping app");
        fetch("https://proyecto-c-shipping-bonzai.vercel.app/api/shipping/dispatch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${clerkToken}`,
          },
          body: JSON.stringify({
            orderRef: id,
            transactionId,
            sellerId: sellerClerkId,
            buyerId,
            deliveryAddress,
            type: type || "OTROS",
          }),
        }).then(async (r) => {
          const text = await r.text();
          console.error("[orders PATCH shipping response]", r.status, text);
        }).catch((err) => console.error("[orders PATCH shipping fire-and-forget]", err));
      } else {
        console.error("[orders PATCH] skipping shipping — missing fields", { hasToken: !!clerkToken, hasTx: !!transactionId, hasBuyer: !!buyerId, hasAddr: !!deliveryAddress });
      }

      return NextResponse.json({ success: true, orderId: result.orderId, newStatus: result.newStatus });
    }

    return NextResponse.json(
      { error: "INVALID_REQUEST", message: "Unknown action." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[orders PATCH]", error);
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
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
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
    const serviceKey = req.headers.get("x-service-key");

    if (serviceKey === process.env.SERVICE_API_KEY) {
      let reason: string | undefined;
      try {
        const body = await req.json();
        const parsed = cancelOrderSchema.safeParse(body);
        if (parsed.success) {
          reason = parsed.data.reason;
        }
      } catch {
        // no body or invalid JSON — reason is optional
      }

      const result = await orderService.cancelOrder(id, reason);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.status }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Seller cancelling their own order
    const sellerId = await getSellerId();
    const order = await prisma.order.findUnique({ where: { id }, select: { sellerId: true, status: true } });
    if (!order) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Order not found." }, { status: 404 });
    }
    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: "FORBIDDEN", message: "Not your order." }, { status: 403 });
    }
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return NextResponse.json({ error: "INVALID_STATUS", message: "Solo se pueden cancelar órdenes en estado PENDING o PAID." }, { status: 409 });
    }

    const result = await orderService.cancelOrder(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[orders DELETE]", error);
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
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
