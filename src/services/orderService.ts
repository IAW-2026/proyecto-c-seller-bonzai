import { prisma } from "../lib/prisma";
import * as orderRepo from "../repositories/orderRepository";
import * as purchaseRepo from "../repositories/purchaseRepository";
import * as productRepo from "../repositories/productRepository";
import * as reservationRepo from "../repositories/reservationRepository";
import type { Prisma } from "@prisma/client";
import { OrderStatus, ReservationStatus, PurchaseStatus } from "@prisma/client";
import { sendNewOrderEmail } from "./emailService";

interface ShippingInfo {
  shippingName: string;
  shippingLastName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingProvince: string;
  shippingZip: string;
  shippingPhone?: string;
}

export async function createOrder(
  orderId: string | undefined,
  buyerId: string,
  reservationIds: string[],
  status: string | undefined,
  shipping: ShippingInfo,
) {
  // Batch-fetch all reservations and products
  const reservations = await reservationRepo.findReservationsByIds(reservationIds);
  if (reservations.length !== reservationIds.length) {
    const missing = reservationIds.filter((id) => !reservations.find((r) => r.id === id));
    return { success: false, error: "RESERVATION_NOT_FOUND", message: `Las reservas ${missing.join(", ")} no existen.`, status: 404 };
  }

  for (const reservation of reservations) {
    if (reservation.buyerId !== buyerId) {
      return { success: false, error: "RESERVATION_NOT_YOURS", message: `La reserva ${reservation.id} no pertenece al comprador.`, status: 403 };
    }
    if (reservation.status !== ReservationStatus.ACTIVE) {
      return { success: false, error: "RESERVATION_NOT_ACTIVE", message: `La reserva ${reservation.id} no está activa.`, status: 409 };
    }
  }

  const productIds = [...new Set(reservations.map((r) => r.productId))];
  const products = await productRepo.findProductsByIds(productIds);
  if (products.length !== productIds.length) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "Uno o más productos no existen.", status: 404 };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Group reservations by sellerId
  const sellerGroups = new Map<string, { reservationIds: string[]; items: Prisma.OrderItemCreateManyOrderInput[] }>();

  for (const reservation of reservations) {
    const product = productMap.get(reservation.productId);
    if (!product) {
      return { success: false, error: "PRODUCT_NOT_FOUND", message: `Producto asociado a reserva ${reservation.id} no encontrado.`, status: 404 };
    }

    if (!product.isActive) {
      return { success: false, error: "PRODUCT_INACTIVE", message: `El producto ${product.name} no está disponible.`, status: 409 };
    }
    if (product.suspended) {
      return { success: false, error: "PRODUCT_SUSPENDED", message: `El producto ${product.name} está suspendido.`, status: 409 };
    }
    if (product.seller.suspended) {
      return { success: false, error: "SELLER_SUSPENDED", message: `El vendedor del producto ${product.name} está suspendido.`, status: 409 };
    }

    const quantity = reservation.quantity;
    const unitPrice = product.price;
    const subtotal = unitPrice * quantity;

    const sellerId = product.sellerId;
    if (!sellerGroups.has(sellerId)) {
      sellerGroups.set(sellerId, { reservationIds: [], items: [] });
    }
    const group = sellerGroups.get(sellerId)!;
    group.reservationIds.push(reservation.id);
    group.items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      subtotal,
    });
  }

  if (sellerGroups.size === 0) {
    return { success: false, error: "SELLER_NOT_FOUND", message: "No existe un vendedor asociado a la orden indicada.", status: 404 };
  }

  const normalizedStatus: OrderStatus = status === "PENDING" || status === "PAID" || status === "CANCELLED" ? (status as OrderStatus) : OrderStatus.PENDING;

  // Create Orders inside a transaction (no Purchase yet — created at payment confirmation)
  const result = await prisma.$transaction(async (tx) => {
    const ordersData = Array.from(sellerGroups.entries()).map(([sellerId, group]) => {
      const total = group.items.reduce((acc, item) => acc + item.subtotal, 0);
      return {
        data: {
          id: crypto.randomUUID(),
          buyerId,
          sellerId,
          status: normalizedStatus,
          total,
          shippingName: shipping.shippingName,
          shippingLastName: shipping.shippingLastName,
          shippingAddress: shipping.shippingAddress,
          shippingCity: shipping.shippingCity,
          shippingProvince: shipping.shippingProvince,
          shippingZip: shipping.shippingZip,
          shippingPhone: shipping.shippingPhone || null,
          items: {
            create: group.items,
          },
        } satisfies Prisma.OrderCreateInput,
        reservationIds: group.reservationIds,
      };
    });

    const createdOrders: Array<Prisma.OrderGetPayload<{}>> = [];
    for (const { data, reservationIds: ids } of ordersData) {
      const order = await tx.order.create({ data });
      createdOrders.push(order);
      if (ids.length > 0) {
        await tx.reservation.updateMany({
          where: { id: { in: ids }, status: ReservationStatus.ACTIVE },
          data: { status: ReservationStatus.COMPLETED },
        });
      }
    }

    return { orders: createdOrders };
  });

  // Fire-and-forget email per order
  for (const order of result.orders) {
    const group = sellerGroups.get(order.sellerId);
    if (group) {
      sendNewOrderEmail(order.sellerId, order.id, buyerId, group.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal,
      })), order.total);
    }
  }

  return {
    success: true,
    orderIds: result.orders.map((o) => o.id),
  };
}



export async function cancelOrder(orderId: string, reason?: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "La orden indicada no existe.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_ALREADY_CANCELLED", message: "La orden ya fue cancelada previamente.", status: 409 };
  }

  if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
    return { success: false, error: "INVALID_STATUS", message: "Solo se pueden cancelar órdenes en estado PENDING o PAID.", status: 409 };
  }

  await orderRepo.cancelOrderWithStockRestore(orderId, reason);

  return { success: true };
}

export async function confirmPayment(
  buyerId: string,
  orderIds: string[],
  transactionId: string,
  paidAt?: string,
) {
  if (orderIds.length === 0) {
    return { success: false, error: "INVALID_REQUEST", message: "Debe incluir al menos un orderId.", status: 400 };
  }

  // Batch-fetch all orders
  const orders = await orderRepo.findOrdersByIds(orderIds);
  const foundIds = new Set(orders.map((o) => o.id));

  for (const id of orderIds) {
    const order = orders.find((o) => o.id === id);
    if (!order) {
      return { success: false, error: "ORDER_NOT_FOUND", message: `La orden ${id} no existe.`, status: 404 };
    }
    if (order.buyerId !== buyerId) {
      return { success: false, error: "ORDER_NOT_YOURS", message: `La orden ${id} no pertenece al comprador.`, status: 403 };
    }
    if (order.status === OrderStatus.CANCELLED) {
      return { success: false, error: "ORDER_CANCELLED", message: `La orden ${id} fue cancelada y no puede recibir pago.`, status: 409 };
    }
    if (order.status === OrderStatus.PAID) {
      return { success: false, error: "PAYMENT_ALREADY_CONFIRMED", message: `La orden ${id} ya fue pagada.`, status: 409 };
    }
    if (order.status !== OrderStatus.PENDING) {
      return { success: false, error: "INVALID_STATUS", message: `La orden ${id} no está en estado PENDING.`, status: 409 };
    }
  }

  const paidAtDate = paidAt ? new Date(paidAt) : new Date();

  // Create Purchase and link orders inside a transaction
  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        buyerId,
        status: PurchaseStatus.COMPLETED,
      },
    });

    const updateResult = await tx.order.updateMany({
      where: { id: { in: orderIds }, status: OrderStatus.PENDING },
      data: {
        status: OrderStatus.PAID,
        purchaseId: purchase.id,
        transactionId,
        paidAt: paidAtDate,
      },
    });

    return { purchaseId: purchase.id, updatedCount: updateResult.count };
  });

  return {
    success: true,
    purchaseId: result.purchaseId,
    updatedCount: result.updatedCount,
  };
}

export async function shipOrder(orderId: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "Order not found.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_CANCELLED", message: "Cannot ship a cancelled order.", status: 409 };
  }

  if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.AWAITING_TRACKING) {
    return { success: false, error: "ALREADY_SHIPPED", message: "Order is already shipped or awaiting tracking.", status: 409 };
  }

  if (order.status === OrderStatus.PENDING) {
    return { success: false, error: "ORDER_NOT_PAID", message: "Order must be paid before shipping.", status: 409 };
  }

  await orderRepo.shipToAwaitingTracking(orderId);

  return { success: true, orderId, newStatus: OrderStatus.AWAITING_TRACKING };
}

export async function submitTracking(orderId: string, trackingId: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "Order not found.", status: 404 };
  }

  if (order.status !== OrderStatus.AWAITING_TRACKING) {
    return { success: false, error: "INVALID_STATUS", message: "Order is not awaiting tracking.", status: 409 };
  }

  await orderRepo.submitTracking(orderId, trackingId);

  return { success: true, orderId, newStatus: OrderStatus.SHIPPED };
}

export async function getOrdersByBuyer(buyerId: string) {
  const orders = await orderRepo.findOrdersByBuyerId(buyerId);

  return {
    orders: orders.map((order) => ({
      orderId: order.id,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      trackingId: order.trackingId,
    })),
  };
}

export async function getPurchaseHistory(buyerId: string) {
  const purchases = await purchaseRepo.findPurchasesByBuyerId(buyerId);

  return {
    purchases: purchases.map((p) => ({
      purchaseId: p.id,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      orders: p.orders.map((o) => ({
        orderId: o.id,
        sellerId: o.sellerId,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        trackingId: o.trackingId,
        items: o.items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      })),
    })),
  };
}
