import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function requireAdmin(): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  let user;
  try {
    const client = await clerkClient();
    user = await client.users.getUser(userId);
  } catch {
    throw new Error("UNAUTHORIZED");
  }
  const raw = user.publicMetadata as Record<string, unknown> | undefined;
  const roles: string[] = Array.isArray(raw?.roles) ? raw.roles : [];

  if (!roles.includes("seller_admin") && !roles.includes("super_admin")) {
    throw new Error("FORBIDDEN");
  }
}

async function getAuthenticatedProfile() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");

  const profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) throw new Error("SELLER_NOT_FOUND");
  if (!profile.approved) throw new Error("SELLER_NOT_APPROVED");
  if (profile.suspended) throw new Error("SELLER_SUSPENDED");

  return profile;
}

export async function getSellerId(): Promise<string> {
  const profile = await getAuthenticatedProfile();
  return profile.id;
}

export async function getSellerClerkId(): Promise<string> {
  const profile = await getAuthenticatedProfile();
  return profile.clerkId;
}

export async function requireAdminOrServiceKey(req?: Request): Promise<void> {
  if (req) {
    const serviceKey = req.headers.get("x-service-key");
    if (serviceKey === process.env.SERVICE_API_KEY) {
      return;
    }
  }
  await requireAdmin();
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
