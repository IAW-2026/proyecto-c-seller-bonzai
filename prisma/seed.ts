import { PrismaClient, $Enums } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  "Succulents", "Cacti", "Ferns", "Palms", "Orchids",
  "Philodendrons", "Monstera & Swiss Cheese Plants", "Ficus & Fig Trees",
  "Pothos & Epipremnum", "Calatheas & Marantas", "Alocasias & Colocasias",
  "Begonias", "Hoyas", "Snake Plants (Sansevieria)", "ZZ Plants",
  "Dracaenas", "Spider Plants (Chlorophytum)", "Peace Lilies (Spathiphyllum)",
  "Anthuriums", "Bromeliads", "Air Plants (Tillandsia)", "Mosses & Lichens",
  "Carnivorous Plants", "Herbs & Edible Plants", "Aromatic & Medicinal Plants",
  "Climbing & Trailing Plants", "Flowering Houseplants", "Foliage Houseplants",
  "Pet-Friendly Plants", "Low-Light Plants", "Hardy Outdoor Plants",
  "Tropical Plants", "Bonsai Trees", "Aquatic & Semi-Aquatic Plants",
  "Cuttings & Propagation", "Seeds & Bulbs", "Pots & Planters",
  "Soil & Substrates", "Fertilizers & Plant Care", "Tools & Accessories",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const sellerUsers = [
  {
    clerkId: "user_2n2d9Jq8pK5fL3rX7cTvBbWmZ1y",
    email: "seller_admin+clerk_test@iaw.com",
  },
  {
    clerkId: "user_2n2d9Kq8pK5fL3rX7cTvBbWmZ2a",
    email: "green.nursery@example.com",
  },
  {
    clerkId: "user_2n2d9Lq8pK5fL3rX7cTvBbWmZ3b",
    email: "south.gardens@example.com",
  },
];

const productTemplates = [
  { name: "Ceramic Pot 20cm", price: [12.5, 18.0], stock: [20, 80], category: "Pots & Planters" },
  { name: "Echeveria Elegans Succulent", price: [4.5, 7.0], stock: [30, 120], category: "Succulents" },
  { name: "Boston Fern Nephrolepis", price: [8.0, 14.0], stock: [10, 50], category: "Ferns" },
  { name: "Monstera Deliciosa 60cm", price: [22.0, 35.0], stock: [5, 25], category: "Monstera & Swiss Cheese Plants" },
  { name: "Potting Soil Mix 5kg", price: [3.5, 6.0], stock: [40, 150], category: "Soil & Substrates" },
  { name: "Liquid Fertilizer 500ml", price: [7.0, 12.0], stock: [25, 90], category: "Fertilizers & Plant Care" },
  { name: "White Phalaenopsis Orchid", price: [18.0, 28.0], stock: [8, 30], category: "Orchids" },
  { name: "Golden Barrel Cactus", price: [10.0, 16.0], stock: [15, 45], category: "Cacti" },
  { name: "Golden Pothos Epipremnum", price: [6.0, 10.0], stock: [20, 70], category: "Pothos & Epipremnum" },
  { name: "Lavender Officinalis Pot", price: [7.5, 12.0], stock: [12, 40], category: "Aromatic & Medicinal Plants" },
  { name: "Hanging Pot 25cm", price: [9.0, 15.0], stock: [15, 60], category: "Pots & Planters" },
  { name: "Burro's Tail Succulent", price: [5.0, 8.0], stock: [25, 90], category: "Succulents" },
  { name: "San Pedro Cactus", price: [14.0, 22.0], stock: [8, 30], category: "Cacti" },
  { name: "Calathea Orbifolia", price: [16.0, 25.0], stock: [6, 20], category: "Calatheas & Marantas" },
  { name: "Staghorn Fern", price: [20.0, 32.0], stock: [4, 15], category: "Ferns" },
  { name: "Metal Watering Can 2L", price: [11.0, 18.0], stock: [10, 40], category: "Tools & Accessories" },
  { name: "Fresh Basil Pot", price: [3.0, 5.5], stock: [30, 100], category: "Herbs & Edible Plants" },
  { name: "Fiddle Leaf Fig 80cm", price: [28.0, 45.0], stock: [5, 20], category: "Ficus & Fig Trees" },
  { name: "Cactus Potting Mix 2kg", price: [4.0, 7.0], stock: [20, 80], category: "Soil & Substrates" },
  { name: "ZZ Plant Zamioculcas", price: [12.0, 19.0], stock: [10, 35], category: "ZZ Plants" },
  { name: "Self-Watering Pot 15cm", price: [8.0, 14.0], stock: [18, 55], category: "Pots & Planters" },
  { name: "Professional Pruning Shears", price: [14.0, 22.0], stock: [10, 30], category: "Tools & Accessories" },
  { name: "Aloe Vera Pot 15cm", price: [6.5, 10.0], stock: [20, 60], category: "Succulents" },
  { name: "Dracaena Marginata 60cm", price: [15.0, 24.0], stock: [8, 28], category: "Dracaenas" },
  { name: "Peace Lily Spathiphyllum", price: [9.0, 14.0], stock: [12, 40], category: "Peace Lilies (Spathiphyllum)" },
  { name: "Peperomia Obtusifolia", price: [7.0, 11.0], stock: [15, 50], category: "Foliage Houseplants" },
  { name: "Begonia Maculata", price: [11.0, 18.0], stock: [8, 25], category: "Begonias" },
  { name: "Pressure Sprayer 1L", price: [6.0, 10.0], stock: [20, 65], category: "Tools & Accessories" },
  { name: "Snake Plant Sansevieria", price: [10.0, 16.0], stock: [15, 45], category: "Snake Plants (Sansevieria)" },
  { name: "Philodendron Brasil", price: [8.0, 13.0], stock: [12, 35], category: "Philodendrons" },
];

const buyerIds = [
  "buyer_clerk_001", "buyer_clerk_002", "buyer_clerk_003",
  "buyer_clerk_004", "buyer_clerk_005", "buyer_clerk_006",
  "buyer_clerk_007", "buyer_clerk_008", "buyer_clerk_009",
  "buyer_clerk_010",
];

const orderStatuses: $Enums.OrderStatus[] = ["PENDING", "PAID", "AWAITING_TRACKING", "SHIPPED", "CANCELLED"];
const orderStatusWeights = [15, 25, 10, 35, 15];

const reservationStatuses: $Enums.ReservationStatus[] = ["ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"];
const reservationStatusWeights = [25, 40, 20, 15];

const reviewComments = [
  "The platform is intuitive and easy to use. Managing orders is straightforward.",
  "Great dashboard, I can track all my sales and inventory in one place.",
  "The analytics tools help me understand my business better.",
  "Customer support is responsive and helpful when I have issues.",
  "I like how easy it is to manage my products and update listings.",
  "The auto-generated slugs and product management save me time.",
  "Would love to see more customization options for my storefront.",
  "Reliable platform, minimal downtime. Happy with the service.",
  "The reservation system works well for my high-demand items.",
  "Onboarding was smooth and I was selling within minutes.",
  "I wish the review system had more features for buyer feedback.",
  "Overall a solid platform for managing my plant business.",
  "The mobile experience could be better, but the desktop is great.",
  "Good integration with payment processors and shipping carriers.",
  "Regular updates and new features show the team cares.",
];

async function main() {
  console.log("=== Bonzai Seller App - Seed Data ===");
  console.log("");

  console.log("Seeding categories...");
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const categoryRecords = await prisma.category.findMany();
  const categoryByName = new Map(categoryRecords.map((c) => [c.name, c.id]));
  const existingSellers = await prisma.sellerProfile.findMany();
  const existingClerkIds = new Set(existingSellers.map((s) => s.clerkId));

  console.log("Seeding sellers (skipping existing)...");
  let newSellers = 0;
  for (const su of sellerUsers) {
    if (!existingClerkIds.has(su.clerkId)) {
      await prisma.sellerProfile.create({
        data: {
          clerkId: su.clerkId,
          email: su.email,
          approved: true,
          suspended: false,
          createdAt: randomDate(new Date("2025-06-01"), new Date("2025-12-31")),
        },
      });
      newSellers++;
    }
  }
  const allSellers = await prisma.sellerProfile.findMany();
  console.log(`  ${newSellers} new sellers created, ${allSellers.length} total.`);

  const seedSellerClerkIds = new Set(sellerUsers.map((s) => s.clerkId));
  const seedSellers = allSellers.filter((s) => seedSellerClerkIds.has(s.clerkId));
  const nonSeedSellers = allSellers.filter((s) => !seedSellerClerkIds.has(s.clerkId));

  console.log("Seeding products for seed sellers (if they have none)...");
  const allProducts = await prisma.product.findMany();
  const productSellersWithData = new Set(allProducts.map((p) => p.sellerId));
  let newProducts = 0;

  for (const seller of seedSellers) {
    if (productSellersWithData.has(seller.clerkId)) {
      console.log(`  Skipping ${seller.email} — already has products.`);
      continue;
    }
    const sellerIdx = seedSellers.indexOf(seller);
    const sellerProductTemplates = productTemplates.slice(
      (sellerIdx * 10) % productTemplates.length,
      (sellerIdx * 10) % productTemplates.length + 9
    );
    for (const tmpl of sellerProductTemplates) {
      const catId = categoryByName.get(tmpl.category);
      const product = await prisma.product.create({
        data: {
          sellerId: seller.clerkId,
          categoryId: catId || null,
          name: tmpl.name,
          description: `Premium quality ${tmpl.name.toLowerCase()}, perfect for indoor and outdoor spaces. Basic care: indirect light and moderate watering.`,
          price: randomFloat(tmpl.price[0], tmpl.price[1]),
          stock: randomInt(tmpl.stock[0], tmpl.stock[1]),
          isActive: true,
          isFragile: Math.random() < 0.3,
          suspended: false,
          moderationStatus: "ACTIVE",
          slug: `${tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          createdAt: randomDate(new Date("2026-01-05"), new Date("2026-03-01")),
        },
      });
      allProducts.push(product);
      newProducts++;
    }
  }
  console.log(`  ${newProducts} new products created, ${allProducts.length} total in DB.`);

  if (allProducts.length === 0) {
    console.log("No products available, skipping orders/reservations/reviews.");
    return;
  }

  const existingSeedOrders = await prisma.order.findFirst({
    where: { sellerId: { in: [...seedSellerClerkIds] } },
  });
  if (existingSeedOrders) {
    console.log("Seed orders already exist, skipping orders/reservations.");
  } else {
  console.log("Seeding orders and purchases...");
  const dateRanges = [
    { start: new Date("2026-03-01"), end: new Date("2026-03-31"), count: 14 },
    { start: new Date("2026-04-01"), end: new Date("2026-04-30"), count: 16 },
    { start: new Date("2026-05-01"), end: new Date("2026-05-31"), count: 12 },
    { start: new Date("2026-06-01"), end: new Date("2026-06-10"), count: 6 },
  ];

  const shippingNames = [
    { name: "Emma", lastName: "Johnson" },
    { name: "Liam", lastName: "Smith" },
    { name: "Olivia", lastName: "Williams" },
    { name: "Noah", lastName: "Brown" },
    { name: "Ava", lastName: "Jones" },
    { name: "Ethan", lastName: "Garcia" },
    { name: "Sophia", lastName: "Miller" },
    { name: "Mason", lastName: "Davis" },
    { name: "Isabella", lastName: "Rodriguez" },
    { name: "Logan", lastName: "Martinez" },
  ];

  const cities = [
    { city: "New York", province: "NY", zip: "10001" },
    { city: "Los Angeles", province: "CA", zip: "90001" },
    { city: "Chicago", province: "IL", zip: "60601" },
    { city: "Houston", province: "TX", zip: "77001" },
    { city: "Phoenix", province: "AZ", zip: "85001" },
    { city: "Miami", province: "FL", zip: "33101" },
    { city: "Seattle", province: "WA", zip: "98101" },
  ];

  let newOrders = 0;
  for (const dr of dateRanges) {
    for (let i = 0; i < dr.count; i++) {
      const createdAt = randomDate(dr.start, dr.end);
      const buyerId = randomItem(buyerIds);
      const seller = randomItem(allSellers);
      const itemCount = randomInt(1, 4);
      const items: { productName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];
      let total = 0;
      for (let j = 0; j < itemCount; j++) {
        const product = randomItem(allProducts);
        const qty = randomInt(1, 3);
        const subtotal = parseFloat((product.price * qty).toFixed(2));
        total += subtotal;
        items.push({
          productName: product.name,
          unitPrice: product.price,
          quantity: qty,
          subtotal,
        });
      }
      total = parseFloat(total.toFixed(2));

      const status = pickWeighted(orderStatuses, orderStatusWeights);
      const shipping = randomItem(shippingNames);
      const addr = randomItem(cities);
      const phone = `+1${randomInt(2000000000, 9999999999)}`;

      const orderDate = createdAt;
      let paidAt: Date | null = null;
      let shippedAt: Date | null = null;
      let awaitingTrackingAt: Date | null = null;
      let cancelledAt: Date | null = null;
      let cancellationReason: string | null = null;

      if (["PAID", "AWAITING_TRACKING", "SHIPPED"].includes(status)) {
        paidAt = new Date(orderDate.getTime() + randomInt(300000, 86400000));
      }
      if (status === "AWAITING_TRACKING") {
        awaitingTrackingAt = new Date((paidAt || orderDate).getTime() + randomInt(86400000, 172800000));
      }
      if (status === "SHIPPED") {
        awaitingTrackingAt = new Date((paidAt || orderDate).getTime() + randomInt(86400000, 172800000));
        shippedAt = new Date(awaitingTrackingAt.getTime() + randomInt(86400000, 259200000));
      }
      if (status === "CANCELLED") {
        cancelledAt = new Date(orderDate.getTime() + randomInt(3600000, 259200000));
        cancellationReason = randomItem([
          "Buyer requested cancellation",
          "Product out of stock",
          "Shipping address error",
          "Payment declined",
          "Duplicate order",
        ]);
      }

      const order = await prisma.order.create({
        data: {
          buyerId,
          sellerId: seller.clerkId,
          status,
          total,
          transactionId: status !== "PENDING" && status !== "CANCELLED" ? `mp_trans_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null,
          trackingId: status === "SHIPPED" || status === "AWAITING_TRACKING" ? `COR${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 4).toUpperCase()}` : null,
          cancellationReason,
          shippingName: shipping.name,
          shippingLastName: shipping.lastName,
          shippingAddress: `${addr.city} ${randomInt(100, 5000)}`,
          shippingCity: addr.city,
          shippingProvince: addr.province,
          shippingZip: addr.zip,
          shippingPhone: phone,
          paidAt,
          shippedAt,
          awaitingTrackingAt,
          cancelledAt,
          createdAt,
          items: {
            create: items.map((item) => ({
              productId: randomItem(allProducts).id,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
      });

      if (i % 3 === 0) {
        await prisma.purchase.create({
          data: {
            buyerId,
            status: "COMPLETED",
            createdAt,
            orders: { connect: [{ id: order.id }] },
          },
        });
      }
      newOrders++;
    }
  }
  console.log(`  ${newOrders} new orders created.`);

  console.log("Seeding reservations...");
  const reservationDateRanges = [
    { start: new Date("2026-03-01"), end: new Date("2026-03-31"), count: 5 },
    { start: new Date("2026-04-01"), end: new Date("2026-04-30"), count: 5 },
    { start: new Date("2026-05-01"), end: new Date("2026-05-31"), count: 4 },
    { start: new Date("2026-06-01"), end: new Date("2026-06-10"), count: 2 },
  ];

  let newReservations = 0;
  for (const dr of reservationDateRanges) {
    for (let i = 0; i < dr.count; i++) {
      const createdAt = randomDate(dr.start, dr.end);
      const product = randomItem(allProducts);
      const status = pickWeighted(reservationStatuses, reservationStatusWeights);
      const expiresAt = new Date(createdAt.getTime() + randomInt(86400000 * 2, 86400000 * 14));

      await prisma.reservation.create({
        data: {
          productId: product.id,
          sellerId: randomItem(allSellers).clerkId,
          buyerId: randomItem(buyerIds),
          quantity: randomInt(1, 5),
          status,
          expiresAt,
          createdAt,
        },
      });
      newReservations++;
    }
  }
  console.log(`  ${newReservations} new reservations created.`);
  }

  console.log("Seeding reviews (skipping sellers that already have one)...");
  const existingReviews = await prisma.sellerReview.findMany({ select: { sellerId: true } });
  const reviewedSellerIds = new Set(existingReviews.map((r) => r.sellerId));
  let newReviews = 0;

  for (const seller of allSellers) {
    if (!reviewedSellerIds.has(seller.id)) {
      const rating = pickWeighted([5, 4, 3, 2, 1], [40, 30, 15, 10, 5]);
      const comment = randomItem(reviewComments);
      await prisma.sellerReview.create({
        data: {
          sellerId: seller.id,
          rating,
          comment,
          createdAt: randomDate(new Date("2026-03-10"), new Date("2026-06-05")),
        },
      });
      newReviews++;
    }
  }
  console.log(`  ${newReviews} new reviews created.`);

  const orderCount = await prisma.order.count();
  const purchaseCount = await prisma.purchase.count();
  const reservationCount = await prisma.reservation.count();
  const reviewCount = await prisma.sellerReview.count();
  const productCount = await prisma.product.count();

  console.log("");
  console.log("Seed completed successfully!");
  console.log(`  Categories:    ${categories.length}`);
  console.log(`  Sellers:       ${allSellers.length}`);
  console.log(`  Products:      ${productCount}`);
  console.log(`  Orders:        ${orderCount}`);
  console.log(`  Purchases:     ${purchaseCount}`);
  console.log(`  Reservations:  ${reservationCount}`);
  console.log(`  Reviews:       ${reviewCount}`);
  console.log("");
  console.log("No existing data was deleted.");
  console.log("Data range: March 2026 - June 2026 (3+ months)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
