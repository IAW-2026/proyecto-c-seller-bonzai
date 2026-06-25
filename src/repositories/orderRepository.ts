import { prisma } from "../lib/prisma";
import { OrderStatus, ReservationStatus } from "@prisma/client";
import type { Order, OrderItem } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type OrderWithItems = Order & { items: OrderItem[] };

export async function findOrderById(id: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { id } });
}

export async function findOrdersByIds(ids: string[]): Promise<Order[]> {
  return prisma.order.findMany({
    where: { id: { in: ids } },
  });
}

export async function findOrdersByBuyerId(buyerId: string): Promise<OrderWithItems[]> {
  return prisma.order.findMany({
    where: { buyerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(data: Prisma.OrderCreateInput): Promise<Order> {
  return prisma.order.create({ data });
}

export async function createOrderWithReservationConsumption(
  orderData: Prisma.OrderCreateInput,
  reservationIds: string[],
): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({ data: orderData });

    if (reservationIds.length > 0) {
      await tx.reservation.updateMany({
        where: {
          id: { in: reservationIds },
          status: ReservationStatus.ACTIVE,
        },
        data: { status: ReservationStatus.COMPLETED },
      });
    }

    return order;
  });
}

export async function createOrdersForSellers(
  ordersData: { data: Prisma.OrderCreateInput; reservationIds: string[] }[],
): Promise<Order[]> {
  return prisma.$transaction(async (tx) => {
    const orders: Order[] = [];
    for (const { data, reservationIds } of ordersData) {
      const order = await tx.order.create({ data });
      orders.push(order);
      if (reservationIds.length > 0) {
        await tx.reservation.updateMany({
          where: { id: { in: reservationIds }, status: ReservationStatus.ACTIVE },
          data: { status: ReservationStatus.COMPLETED },
        });
      }
    }
    return orders;
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}

export async function cancelOrderWithStockRestore(id: string, reason?: string): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
      throw new Error("ORDER_CANNOT_BE_CANCELLED");
    }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, cancellationReason: reason, cancelledAt: new Date() },
    });
  });
}

export async function confirmOrdersWithPurchase(
  orderIds: string[],
  purchaseId: string,
  transactionId: string,
  paidAt: Date,
): Promise<{ count: number }> {
  return prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: { in: orderIds }, status: OrderStatus.PENDING },
      data: {
        status: OrderStatus.PAID,
        purchaseId,
        transactionId,
        paidAt,
      },
    });
    return { count: result.count };
  });
}

export async function shipToAwaitingTracking(id: string): Promise<Order> {
  return prisma.order.update({
    where: { id, status: OrderStatus.PAID },
    data: { status: OrderStatus.AWAITING_TRACKING, awaitingTrackingAt: new Date() },
  });
}

export async function submitTracking(id: string, trackingId: string): Promise<Order> {
  return prisma.order.update({
    where: { id, status: OrderStatus.AWAITING_TRACKING },
    data: { status: OrderStatus.SHIPPED, trackingId, shippedAt: new Date() },
  });
}
