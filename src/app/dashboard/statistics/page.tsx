import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import { Package, ShoppingBag, Calendar, DollarSign } from "lucide-react";
import styles from "./page.module.css";

export default async function StatisticsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: true, suspended: false },
    });
  }

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: profile.id, isActive: true },
    }),
    prisma.order.findMany({
      where: { sellerId: profile.id },
    }),
  ]);

  const productIds = products.map((p) => p.id);
  const reservations = await prisma.reservation.findMany({
    where: { productId: { in: productIds } },
  });

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalReservations = reservations.length;
  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: "Total Products", value: totalProducts, icon: <Package size={18} /> },
    { label: "Total Orders", value: totalOrders, icon: <ShoppingBag size={18} /> },
    { label: "Reservations", value: totalReservations, icon: <Calendar size={18} /> },
    { label: "Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: <DollarSign size={18} /> },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Sales <span className={styles.italic}>Statistics</span>
        </h1>
        <p className={styles.welcome}>
          Performance overview for your store
        </p>
      </header>

      <div className={styles.grid}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconWrapper}>{stat.icon}</div>
              <span className={styles.cardValue}>{stat.value}</span>
            </div>
            <span className={styles.cardLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
