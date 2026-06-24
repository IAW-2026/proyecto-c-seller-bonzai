import * as productRepo from "../repositories/productRepository";
import type { Prisma } from "@prisma/client";
import { uploadImageToCloudinary } from "../lib/cloudinary";
import { generateProductSlug } from "../lib/slug";

export async function createProduct(data: { name: string; description?: string; price: number; stock: number; sellerId: string; categoryId?: string; imageUrl?: string; isFragile?: boolean }) {
  const product = await productRepo.createProduct({
    name: data.name,
    description: data.description || "",
    price: data.price,
    stock: data.stock,
    seller: { connect: { clerkId: data.sellerId } },
    isActive: true,
    imageUrl: data.imageUrl ? await uploadImageToCloudinary(data.imageUrl) : undefined,
    isFragile: data.isFragile ?? false,
  });

  await productRepo.updateProduct(product.id, { slug: generateProductSlug(product.name, product.id) });

  return productRepo.findProductById(product.id);
}

export async function getProductsBySeller(sellerId: string) {
  return productRepo.findProductBySellerId(sellerId, true);
}

export async function updateProduct(id: string, data: { name?: string; description?: string; price?: number; stock?: number; categoryId?: string | null; imageUrl?: string; isFragile?: boolean; isActive?: boolean; suspended?: boolean }) {
  const product = await productRepo.findProductById(id);
  if (!product) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "El producto no existe.", status: 404 };
  }

  const updateData: Prisma.ProductUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.stock !== undefined) updateData.stock = data.stock;
  if (data.imageUrl !== undefined) updateData.imageUrl = await uploadImageToCloudinary(data.imageUrl);
  if (data.isFragile !== undefined) updateData.isFragile = data.isFragile;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.suspended !== undefined) updateData.suspended = data.suspended;
  if (data.categoryId === null || data.categoryId === "") {
    updateData.category = { disconnect: true };
  } else if (data.categoryId !== undefined) {
    updateData.category = { connect: { id: data.categoryId } };
  }

  const updated = await productRepo.updateProduct(id, updateData);

  if (data.name !== undefined && updated.name) {
    await productRepo.updateProduct(id, { slug: generateProductSlug(updated.name, id) });
  }

  return { success: true, product: await productRepo.findProductById(id) };
}

export async function deleteProduct(id: string) {
  const product = await productRepo.findProductById(id);
  if (!product) {
    return { success: false, error: "PRODUCT_NOT_FOUND", message: "El producto no existe.", status: 404 };
  }

  await productRepo.deactivateProduct(id);
  return { success: true };
}
