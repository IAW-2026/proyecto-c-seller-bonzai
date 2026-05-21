import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Layers, CircleAlert, ShoppingBag, DollarSign, Clock, Calendar, ArrowUpRight } from "lucide-react";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: true, suspended: false },
    });
  }

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [products, orders] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: profile.id, isActive: true },
    }),
    prisma.order.findMany({
      where: { sellerId: profile.id },
    }),
  ]);

  const productIds = products.map((p) => p.id);
  const reservations = productIds.length > 0
    ? await prisma.reservation.findMany({ where: { productId: { in: productIds } } })
    : [];

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  const monthlyOrders = orders.filter((o) => o.createdAt >= firstOfMonth);
  const monthlyRevenue = monthlyOrders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;
  const activeReservations = reservations.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Merchant <span className={styles.italic}>Overview</span>
        </h1>
        <p className={styles.welcome}>
          Welcome back, {user.firstName || "Curator"}. Here is your current standing.
        </p>
      </header>

      <div className={styles.sectionLabel}>Inventory</div>
      <div className={styles.stats}>
        <Link href="/dashboard/inventory" className={styles.statCard}>
          <div className={styles.statIcon}><Package size={18} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalProducts}</span>
            <span className={styles.statLabel}>Total Products</span>
          </div>
        </Link>
        <Link href="/dashboard/inventory" className={styles.statCard}>
          <div className={styles.statIcon}><Layers size={18} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalStock}</span>
            <span className={styles.statLabel}>Units in Stock</span>
          </div>
        </Link>
        <Link href="/dashboard/inventory" className={`${styles.statCard} ${outOfStock > 0 ? styles.statCardWarning : ""}`}>
          <div className={`${styles.statIcon} ${outOfStock > 0 ? styles.statIconWarning : ""}`}>
            <CircleAlert size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${outOfStock > 0 ? styles.statValueWarning : ""}`}>{outOfStock}</span>
            <span className={styles.statLabel}>Out of Stock</span>
          </div>
        </Link>
      </div>

      <div className={styles.sectionLabel}>Orders</div>
      <div className={styles.stats}>
        <Link href="/dashboard/orders" className={styles.statCard}>
          <div className={styles.statIcon}><ShoppingBag size={18} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{orders.length}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
        </Link>
        <Link href="/dashboard/orders" className={styles.statCard}>
          <div className={styles.statIcon}><DollarSign size={18} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>${monthlyRevenue.toFixed(2)}</span>
            <span className={styles.statLabel}>Revenue this month</span>
          </div>
        </Link>
        <Link href="/dashboard/orders" className={`${styles.statCard} ${pendingOrders > 0 ? styles.statCardWarning : ""}`}>
          <div className={`${styles.statIcon} ${pendingOrders > 0 ? styles.statIconPending : ""}`}>
            <Clock size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${pendingOrders > 0 ? styles.statValueWarning : ""}`}>{pendingOrders}</span>
            <span className={styles.statLabel}>Pending Orders</span>
          </div>
        </Link>
      </div>

      <div className={styles.sectionLabel}>Reservations</div>
      <div className={styles.stats}>
        <Link href="/dashboard/reservations" className={styles.statCard}>
          <div className={styles.statIcon}><Calendar size={18} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{reservations.length}</span>
            <span className={styles.statLabel}>Total Reservations</span>
          </div>
        </Link>
        <Link href="/dashboard/reservations" className={`${styles.statCard} ${activeReservations > 0 ? styles.statCardWarning : ""}`}>
          <div className={`${styles.statIcon} ${activeReservations > 0 ? styles.statIconPending : ""}`}>
            <Clock size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${activeReservations > 0 ? styles.statValueWarning : ""}`}>{activeReservations}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
