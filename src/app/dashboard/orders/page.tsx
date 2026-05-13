import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, DollarSign, Clock, CheckCircle, XCircle, Truck } from "lucide-react";
import { ShipButton } from "../../../frontend/components/orders/ShipButton";
import { OrderDetailsModal } from "../../../frontend/components/orders/OrderDetailsModal";
import { SearchInput } from "../../../frontend/components/ui/SearchInput/SearchInput";
import styles from "./page.module.css";

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} />,
  PAID: <CheckCircle size={14} />,
  SHIPPED: <Truck size={14} />,
  CANCELLED: <XCircle size={14} />,
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage(props: { searchParams?: Promise<{ search?: string; page?: string }> }) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: true, suspended: false },
    });
  }

  const searchParams = await props.searchParams;
  const search = searchParams?.search?.toLowerCase() || "";
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const validStatuses = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];
  const where: Record<string, unknown> = { sellerId: profile.id };
  if (search && validStatuses.includes(search.toUpperCase())) {
    where.status = search.toUpperCase();
  }

  const [orders, total, allOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
    search
      ? prisma.order.findMany({ where: { sellerId: profile.id }, include: { items: true }, orderBy: { createdAt: "desc" } })
      : null,
  ]);

  const totalPages = Math.ceil(total / limit);

  const statsOrders = allOrders || orders;
  const totalRevenue = statsOrders
    .filter((o) => o.status === "PAID" || o.status === "SHIPPED")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = statsOrders.filter((o) => o.status === "PENDING").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Customer <span className={styles.italic}>Orders</span>
        </h1>
        <p className={styles.welcome}>
          {total} order{total !== 1 ? "s" : ""} received
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><ShoppingBag size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{total}</span>
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

      <SearchInput basePath="/dashboard/orders" defaultValue={search} placeholder="Filter by status (pending, paid, shipped, cancelled)..." />

      {total === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders yet</p>
          <p className={styles.emptyHint}>When customers place orders, they will appear here</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span className={styles.tableHeaderCell}>Order</span>
                <span className={styles.tableHeaderCell}>Items</span>
                <span className={styles.tableHeaderCell}>Total</span>
                <span className={styles.tableHeaderCell}>Status</span>
                <span className={styles.tableHeaderCell}>Date</span>
                <span className={styles.tableHeaderCell}>Actions</span>
              </div>
              {orders.map((order) => (
                <div key={order.id} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <OrderDetailsModal
                      orderId={order.id}
                      status={order.status}
                      total={order.total}
                      createdAt={order.createdAt.toISOString()}
                      trackingId={order.trackingId}
                      items={order.items.map((i) => ({
                        productName: i.productName,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        subtotal: i.subtotal,
                      }))}
                    >
                      <span className={styles.orderId}>#{order.id.slice(0, 8)}</span>
                    </OrderDetailsModal>
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
                  <div className={styles.tableCell}>
                    {order.status === "PAID" ? (
                      <ShipButton orderId={order.id} />
                    ) : order.status === "SHIPPED" && order.trackingId ? (
                      <span className={styles.trackingId}>Track: {order.trackingId}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <Link href={`/dashboard/orders?${new URLSearchParams({ page: String(page - 1), ...(search ? { search } : {}) })}`} className={styles.pageLink}>
                  Previous
                </Link>
              )}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/orders?${new URLSearchParams({ page: String(page + 1), ...(search ? { search } : {}) })}`} className={styles.pageLink}>
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
