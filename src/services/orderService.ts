import * as orderRepo from "../repositories/orderRepository";
import * as productRepo from "../repositories/productRepository";
import * as reservationRepo from "../repositories/reservationRepository";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

export async function createOrder(orderId: string | undefined, buyerId: string, reservationIds: string[], status?: string) {
  const finalOrderId = orderId?.trim() || crypto.randomUUID();

  if (orderId) {
    const existing = await orderRepo.findOrderById(finalOrderId);
    if (existing) {
      return { success: false, error: "ORDER_ALREADY_EXISTS", message: "La orden ya fue registrada previamente en el contexto del seller.", status: 409 };
    }
  }

  let sellerId: string | null = null;
  const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
  const resolvedReservationIds: string[] = [];

  for (const reservationId of reservationIds) {
    const reservation = await reservationRepo.findReservationById(reservationId);
    if (!reservation) {
      return { success: false, error: "RESERVATION_NOT_FOUND", message: `La reserva ${reservationId} no existe.`, status: 404 };
    }
    if (reservation.buyerId !== buyerId) {
      return { success: false, error: "RESERVATION_NOT_YOURS", message: `La reserva ${reservationId} no pertenece al comprador.`, status: 403 };
    }
    if (reservation.status !== "ACTIVE") {
      return { success: false, error: "RESERVATION_NOT_ACTIVE", message: `La reserva ${reservationId} no está activa.`, status: 409 };
    }

    const product = await productRepo.findProductById(reservation.productId);
    if (!product) {
      return { success: false, error: "PRODUCT_NOT_FOUND", message: `El producto asociado a la reserva ${reservationId} no existe.`, status: 404 };
    }

    if (!sellerId) {
      sellerId = product.sellerId;
    } else if (product.sellerId !== sellerId) {
      return {
        success: false,
        error: "MIXED_SELLER_ITEMS",
        message: "Todos los items de la orden deben pertenecer al mismo vendedor.",
        status: 400,
      };
    }

    if (!product.isActive) {
      return { success: false, error: "PRODUCT_INACTIVE", message: `El producto ${product.name} no está disponible.`, status: 409 };
    }

    const quantity = reservation.quantity;
    const unitPrice = product.price;
    const subtotal = unitPrice * quantity;

    orderItems.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      subtotal,
    });

    resolvedReservationIds.push(reservation.id);
  }

  if (!sellerId) {
    return { success: false, error: "SELLER_NOT_FOUND", message: "No existe un vendedor asociado a la orden indicada.", status: 404 };
  }

  const total = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const normalizedStatus: OrderStatus = status === "PENDING" || status === "PAID" || status === "CANCELLED" ? (status as OrderStatus) : OrderStatus.PENDING;

  await orderRepo.createOrderWithReservationConsumption({
    id: finalOrderId,
    buyerId,
    sellerId,
    status: normalizedStatus,
    total,
    items: {
      create: orderItems,
    },
  }, resolvedReservationIds);

  return { success: true, orderId: finalOrderId, status: 201 };
}

export async function cancelOrder(orderId: string, reason?: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "La orden indicada no existe en el contexto del seller.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_ALREADY_CANCELLED", message: "La orden ya fue cancelada previamente.", status: 409 };
  }

  await orderRepo.cancelOrderWithStockRestore(orderId, reason);

  return { success: true };
}

export async function confirmPayment(orderId: string, transactionId: string, paidAt?: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "No existe una orden con ese orderId.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_CANCELLED", message: "La orden fue cancelada y no puede recibir pago.", status: 409 };
  }

  if (order.status === OrderStatus.PAID) {
    return { success: false, error: "PAYMENT_ALREADY_CONFIRMED", message: "El pago ya fue confirmado previamente.", status: 409 };
  }

  const paidAtDate = paidAt ? new Date(paidAt) : new Date();

  await orderRepo.confirmPayment(orderId, transactionId, paidAtDate);

  return {
    success: true,
    orderId,
    newStatus: OrderStatus.PAID,
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
