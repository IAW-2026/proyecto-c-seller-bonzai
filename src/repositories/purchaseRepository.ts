import { prisma } from "../lib/prisma";
import type { Purchase, Order } from "@prisma/client";

export type PurchaseWithOrders = Purchase & { orders: (Order & { items: { id: string; productId: string; productName: string; unitPrice: number; quantity: number; subtotal: number }[] })[] };

export async function createPurchase(data: { buyerId: string }): Promise<Purchase> {
  return prisma.purchase.create({ data });
}

export async function findPurchasesByBuyerId(buyerId: string): Promise<PurchaseWithOrders[]> {
  return prisma.purchase.findMany({
    where: { buyerId },
    include: {
      orders: {
        include: { items: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPurchaseById(id: string): Promise<PurchaseWithOrders | null> {
  return prisma.purchase.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: true },
      },
    },
  });
}
