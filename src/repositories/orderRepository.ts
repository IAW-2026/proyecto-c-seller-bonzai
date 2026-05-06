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

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status },
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
