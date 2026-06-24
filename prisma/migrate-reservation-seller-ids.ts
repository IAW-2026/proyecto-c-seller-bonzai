import { prisma } from "../src/lib/prisma";

async function main() {
  const reservations = await prisma.reservation.findMany({
    select: { id: true, sellerId: true },
  });

  const internalIds = [...new Set(reservations.map((r) => r.sellerId).filter(Boolean) as string[])];

  const profiles = await prisma.sellerProfile.findMany({
    where: { id: { in: internalIds } },
    select: { id: true, clerkId: true },
  });

  const clerkIdMap = new Map(profiles.map((s) => [s.id, s.clerkId]));

  let updated = 0;
  let skipped = 0;

  for (const reservation of reservations) {
    if (!reservation.sellerId) { skipped++; continue; }
    const clerkId = clerkIdMap.get(reservation.sellerId);
    if (clerkId && reservation.sellerId !== clerkId) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { sellerId: clerkId },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. ${updated} reservations updated, ${skipped} skipped.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
