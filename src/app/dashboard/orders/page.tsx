import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import { ShoppingBag, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import styles from "./page.module.css";

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} />,
  PAID: <CheckCircle size={14} />,
  CANCELLED: <XCircle size={14} />,
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: false, suspended: false },
    });
  }

  const orders = await prisma.order.findMany({
    where: { sellerId: profile.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Customer <span className={styles.italic}>Orders</span>
        </h1>
        <p className={styles.welcome}>
          {orders.length} order{orders.length !== 1 ? "s" : ""} received
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><ShoppingBag size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{orders.length}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><DollarSign size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>${totalRevenue.toFixed(2)}</span>
            <span className={styles.statLabel}>Revenue</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{pendingOrders}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders yet</p>
          <p className={styles.emptyHint}>When customers place orders, they will appear here</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderCell}>Order</span>
            <span className={styles.tableHeaderCell}>Items</span>
            <span className={styles.tableHeaderCell}>Total</span>
            <span className={styles.tableHeaderCell}>Status</span>
            <span className={styles.tableHeaderCell}>Date</span>
          </div>
          {orders.map((order) => (
            <div key={order.id} className={styles.tableRow}>
              <div className={styles.tableCell}>
                <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.itemCount}>
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} item{order.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
              </div>
              <div className={styles.tableCell}>
                <span className={`${styles.badge} ${styles[`badge${order.status}`] || ""}`}>
                  <span className={styles.badgeIcon}>{statusIcons[order.status]}</span>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>
              <div className={styles.tableCell}>
                <span className={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
