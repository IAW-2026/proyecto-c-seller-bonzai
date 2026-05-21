import { prisma } from "../lib/prisma";
import type { Product, Prisma } from "@prisma/client";

export async function findProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { seller: true },
  });
}

export async function findProductBySellerId(sellerId: string, isActive = true): Promise<Product[]> {
  return prisma.product.findMany({
    where: { sellerId, isActive },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProduct(data: Prisma.ProductCreateInput): Promise<Product> {
  return prisma.product.create({ data });
}

export async function updateProduct(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
  return prisma.product.update({ where: { id }, data });
}

export async function deactivateProduct(id: string): Promise<Product> {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function decrementStock(productId: string, quantity: number): Promise<Product> {
  return prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } },
  });
}

export async function incrementStock(productId: string, quantity: number): Promise<Product> {
  return prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: quantity } },
  });
}
