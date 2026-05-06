import * as productRepo from "../repositories/productRepository";
import type { Prisma } from "@prisma/client";

export async function createProduct(data: { name: string; description?: string; price: number; stock: number; sellerId: string; categoryId?: string }) {
  const createData: Prisma.ProductCreateInput = {
    name: data.name,
    description: data.description || "",
    price: data.price,
    stock: data.stock,
    sellerId: data.sellerId,
    active: true,
  };

  if (data.categoryId) {
    createData.category = { connect: { id: data.categoryId } };
  }

  return productRepo.createProduct(createData);
}

export async function getProductsBySeller(sellerId: string) {
  return productRepo.findProductBySellerId(sellerId, true);
}

export async function updateProduct(id: string, data: { name?: string; description?: string; price?: number; stock?: number; categoryId?: string }) {
  const product = await productRepo.findProductById(id);
  if (!product) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "El producto no existe.", status: 404 };
  }

  const updateData: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };

  const updated = await productRepo.updateProduct(id, updateData);
  return { success: true, product: updated };
}

export async function deleteProduct(id: string) {
  const product = await productRepo.findProductById(id);
  if (!product) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "El producto no existe.", status: 404 };
  }

  await productRepo.deactivateProduct(id);
  return { success: true };
}
