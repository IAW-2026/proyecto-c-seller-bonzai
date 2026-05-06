import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getSellerId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    throw new Error("SELLER_NOT_FOUND");
  }

  if (!profile.approved) {
    throw new Error("SELLER_NOT_APPROVED");
  }

  if (profile.suspended) {
    throw new Error("SELLER_SUSPENDED");
  }

  return profile.id;
}

export async function verifyProductOwnership(productId: string): Promise<void> {
  const sellerId = await getSellerId();

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (product.sellerId !== sellerId) {
    throw new Error("FORBIDDEN");
  }
}
