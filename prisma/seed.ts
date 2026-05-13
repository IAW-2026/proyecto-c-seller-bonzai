import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  "Succulents",
  "Cacti",
  "Ferns",
  "Palms",
  "Orchids",
  "Philodendrons",
  "Monstera & Swiss Cheese Plants",
  "Ficus & Fig Trees",
  "Pothos & Epipremnum",
  "Calatheas & Marantas",
  "Alocasias & Colocasias",
  "Begonias",
  "Hoyas",
  "Snake Plants (Sansevieria)",
  "ZZ Plants",
  "Dracaenas",
  "Spider Plants (Chlorophytum)",
  "Peace Lilies (Spathiphyllum)",
  "Anthuriums",
  "Bromeliads",
  "Air Plants (Tillandsia)",
  "Mosses & Lichens",
  "Carnivorous Plants",
  "Herbs & Edible Plants",
  "Aromatic & Medicinal Plants",
  "Climbing & Trailing Plants",
  "Flowering Houseplants",
  "Foliage Houseplants",
  "Pet-Friendly Plants",
  "Low-Light Plants",
  "Hardy Outdoor Plants",
  "Tropical Plants",
  "Bonsai Trees",
  "Aquatic & Semi-Aquatic Plants",
  "Cuttings & Propagation",
  "Seeds & Bulbs",
  "Pots & Planters",
  "Soil & Substrates",
  "Fertilizers & Plant Care",
  "Tools & Accessories",
];

async function main() {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
