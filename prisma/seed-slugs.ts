import { prisma } from "../src/lib/prisma";
import { generateProductSlug } from "../src/lib/slug";

async function main() {
  const products = await prisma.product.findMany({ where: { slug: null } });
  console.log(`Found ${products.length} products without slug`);

  for (const product of products) {
    const slug = generateProductSlug(product.name, product.id);
    await prisma.product.update({ where: { id: product.id }, data: { slug } });
    console.log(`  ✓ ${product.name} → ${slug}`);
  }

  console.log("Done");
}

main().catch(console.error);
