import * as orderRepo from "../repositories/orderRepository";
import * as productRepo from "../repositories/productRepository";
import * as reservationRepo from "../repositories/reservationRepository";
import type { Prisma } from "@prisma/client";
import { OrderStatus } from "@prisma/client";

export async function createOrder(orderId: string | undefined, buyerId: string, items: { productId: string; name: string; quantity: number; price: number }[], status?: string) {
  const finalOrderId = orderId?.trim() || crypto.randomUUID();

  if (orderId) {
    const existing = await orderRepo.findOrderById(finalOrderId);
    if (existing) {
      return { success: false, error: "ORDER_ALREADY_EXISTS", message: "La orden ya fue registrada previamente en el contexto del seller.", status: 409 };
    }
  }

  let sellerId: string | null = null;
  const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
  const reservationIds: string[] = [];

  for (const item of items) {
    const product = await productRepo.findProductById(item.productId);
    if (!product) {
      return { success: false, error: "PRODUCT_NOT_FOUND", message: `El producto ${item.productId} no existe.`, status: 404 };
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
      return { success: false, error: "PRODUCT_INACTIVE", message: `El producto ${item.productId} no está disponible.`, status: 409 };
    }

    const subtotal = item.price * item.quantity;

    orderItems.push({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal,
    });

    const reservation = await reservationRepo.findActiveReservationByProductAndBuyer(item.productId, buyerId);
    if (!reservation) {
      return { success: false, error: "NO_ACTIVE_RESERVATION", message: `El producto ${item.name} no tiene una reserva activa. Debe reservarse antes de crear la orden.`, status: 409 };
    }
    reservationIds.push(reservation.id);
  }

  if (!sellerId) {
    return { success: false, error: "SELLER_NOT_FOUND", message: "No existe un vendedor asociado a la orden indicada.", status: 404 };
  }

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
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
  }, reservationIds);

  return { success: true, orderId: finalOrderId, status: 201 };
}

export async function cancelOrder(orderId: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "La orden indicada no existe en el contexto del seller.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_ALREADY_CANCELLED", message: "La orden ya fue cancelada previamente.", status: 409 };
  }

  await orderRepo.cancelOrderWithStockRestore(orderId);

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

export async function shipOrder(orderId: string, trackingId: string) {
  const order = await orderRepo.findOrderById(orderId);

  if (!order) {
    return { success: false, error: "ORDER_NOT_FOUND", message: "Order not found.", status: 404 };
  }

  if (order.status === OrderStatus.CANCELLED) {
    return { success: false, error: "ORDER_CANCELLED", message: "Cannot ship a cancelled order.", status: 409 };
  }

  if (order.status === OrderStatus.SHIPPED) {
    return { success: false, error: "ALREADY_SHIPPED", message: "Order is already shipped.", status: 409 };
  }

  if (order.status === OrderStatus.PENDING) {
    return { success: false, error: "ORDER_NOT_PAID", message: "Order must be paid before shipping.", status: 409 };
  }

  await orderRepo.shipOrder(orderId, trackingId);

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
