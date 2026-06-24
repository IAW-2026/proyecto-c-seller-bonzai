import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Fetching orders with old (internal) sellerId...");

  const orders = await prisma.order.findMany({
    select: { id: true, sellerId: true },
  });

  const internalIds = [...new Set(orders.map((o) => o.sellerId))];

  const profiles = await prisma.sellerProfile.findMany({
    where: { id: { in: internalIds } },
    select: { id: true, clerkId: true },
  });

  const clerkIdMap = new Map(profiles.map((s) => [s.id, s.clerkId]));

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const clerkId = clerkIdMap.get(order.sellerId);
    if (clerkId && order.sellerId !== clerkId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { sellerId: clerkId },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. ${updated} orders updated, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
