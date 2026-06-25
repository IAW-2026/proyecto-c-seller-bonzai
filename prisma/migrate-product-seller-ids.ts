import { prisma } from "../src/lib/prisma";

async function main() {
  // 1. Drop the FK constraint so we can freely update sellerId values
  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_sellerId_fkey"`);
  console.log("FK constraint dropped.");

  // 2. Build the mapping from internal ID -> clerkId
  const products = await prisma.product.findMany({ select: { id: true, sellerId: true } });
  const internalIds = [...new Set(products.map((p) => p.sellerId))];

  const profiles = await prisma.sellerProfile.findMany({
    where: { id: { in: internalIds } },
    select: { id: true, clerkId: true },
  });

  const clerkIdMap = new Map(profiles.map((s) => [s.id, s.clerkId]));

  // 3. Update each product
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const clerkId = clerkIdMap.get(product.sellerId);
    if (clerkId && product.sellerId !== clerkId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { sellerId: clerkId },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. ${updated} products updated, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
