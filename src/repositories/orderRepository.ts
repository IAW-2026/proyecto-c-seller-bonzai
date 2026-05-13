import { prisma } from "../lib/prisma";
import { OrderStatus } from "@prisma/client";
import type { Order, OrderItem } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type OrderWithItems = Order & { items: OrderItem[] };

export async function findOrderById(id: string): Promise<Order | null> {
  return prisma.order.findUnique({ where: { id } });
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
          status: "ACTIVE",
        },
        data: { status: "COMPLETED" },
      });
    }

    return order;
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}

export async function cancelOrderWithStockRestore(id: string): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  });
}

export async function confirmPayment(
  id: string,
  transactionId: string,
  paidAt: Date
): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status: OrderStatus.PAID, transactionId, paidAt },
  });
}

export async function shipOrder(id: string, trackingId: string): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status: OrderStatus.SHIPPED, trackingId, shippedAt: new Date() },
  });
}
