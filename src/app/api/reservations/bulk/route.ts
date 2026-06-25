import { NextResponse } from "next/server";
import { createReservationBulkSchema } from "../../../../validators";
import * as productRepo from "../../../../repositories/productRepository";
import * as reservationRepo from "../../../../repositories/reservationRepository";

export async function POST(req: Request) {
  try {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey !== process.env.SERVICE_API_KEY) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Acceso no autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = createReservationBulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Formato inválido. Debe incluir buyerId y un array items." },
        { status: 400 }
      );
    }

    const { buyerId, orderId: providedOrderId, items } = parsed.data;
    const orderId = providedOrderId || `cart-${crypto.randomUUID()}`;

    // Batch-fetch all products
    const productIds = items.map((i) => i.productId);
    const products = await productRepo.findProductsByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all products
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: "PRODUCT_NOT_FOUND", message: `El producto ${item.productId} no existe.` },
          { status: 404 }
        );
      }
      if (!product.isActive) {
        return NextResponse.json(
          { error: "PRODUCT_INACTIVE", message: `El producto ${product.name} no está disponible.` },
          { status: 409 }
        );
      }
      if (product.suspended) {
        return NextResponse.json(
          { error: "PRODUCT_SUSPENDED", message: `El producto ${product.name} está suspendido.` },
          { status: 409 }
        );
      }
      if (product.seller.suspended) {
        return NextResponse.json(
          { error: "SELLER_SUSPENDED", message: `El vendedor del producto ${product.name} está suspendido.` },
          { status: 409 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: "INSUFFICIENT_STOCK", message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, solicitado: ${item.quantity}.` },
          { status: 409 }
        );
      }
    }

    // Create all reservations in a single transaction
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const reservations = await reservationRepo.createReservationsBulk(
      items.map((item) => ({
        productId: item.productId,
        buyerId,
        quantity: item.quantity,
        sellerId: item.sellerId,
        expiresAt,
        orderId,
      })),
    );

    return NextResponse.json(
      { success: true, reservationIds: reservations.map((r) => r.id) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[reservations/bulk]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
