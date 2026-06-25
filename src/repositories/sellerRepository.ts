import { prisma } from "../lib/prisma";
import type { SellerProfile } from "@prisma/client";

export async function findSellerById(clerkId: string): Promise<SellerProfile | null> {
  return prisma.sellerProfile.findUnique({ where: { clerkId } });
}
