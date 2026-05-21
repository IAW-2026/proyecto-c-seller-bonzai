import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, DollarSign, Clock, CheckCircle, XCircle, Truck, Package } from "lucide-react";
import { ShipButton } from "../../../frontend/components/orders/ShipButton";
import { CancelOrderButton } from "../../../frontend/components/orders/CancelOrderButton";
import { OrderDetailsModal } from "../../../frontend/components/orders/OrderDetailsModal";
import { OrderFilters } from "../../../frontend/components/orders/OrderFilters";
import { ExportCsvButton } from "../../../frontend/components/ui/ExportCsvButton";
import styles from "./page.module.css";

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} />,
  PAID: <CheckCircle size={14} />,
  AWAITING_TRACKING: <Package size={14} />,
  SHIPPED: <Truck size={14} />,
  CANCELLED: <XCircle size={14} />,
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  AWAITING_TRACKING: "Awaiting",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage(props: { searchParams?: Promise<{ search?: string; status?: string; from?: string; to?: string; page?: string }> }) {
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
  const statusFilter = searchParams?.status || "";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { sellerId: profile.id };
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (search) {
    where.items = { some: { productName: { contains: search, mode: "insensitive" } } };
  }
  if (from) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(from) };
  }
  if (to) {
    const toEnd = new Date(to);
    toEnd.setDate(toEnd.getDate() + 1);
    where.createdAt = { ...(where.createdAt as object || {}), lt: toEnd };
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const statsOrders = orders;
  const totalRevenue = statsOrders
    .filter((o) => o.status === "PAID" || o.status === "AWAITING_TRACKING" || o.status === "SHIPPED")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = statsOrders.filter((o) => o.status === "PENDING").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Customer <span className={styles.italic}>Orders</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <p className={styles.welcome}>
            {total} order{total !== 1 ? "s" : ""} received
          </p>
          {orders.length > 0 && (
            <ExportCsvButton
              filename="orders.csv"
              headers={["Order ID", "Items", "Total", "Status", "Date", "Buyer ID", "Tracking ID"]}
              rows={orders.map((o) => [
                o.id.slice(0, 8),
                String(o.items.reduce((s, i) => s + i.quantity, 0)),
                o.total.toFixed(2),
                o.status,
                o.createdAt.toISOString().slice(0, 10),
                o.buyerId,
                o.trackingId || "",
              ])}
            />
          )}
        </div>
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

      <OrderFilters />

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
                          paidAt={order.paidAt?.toISOString() ?? null}
                          awaitingTrackingAt={order.awaitingTrackingAt?.toISOString() ?? null}
                          shippedAt={order.shippedAt?.toISOString() ?? null}
                          cancelledAt={order.cancelledAt?.toISOString() ?? null}
                          trackingId={order.trackingId}
                          cancellationReason={order.cancellationReason}
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
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {order.status === "PAID" ? (
                        <>
                          <ShipButton orderId={order.id} />
                          <CancelOrderButton orderId={order.id} iconOnly />
                        </>
                      ) : order.status === "PENDING" ? (
                        <CancelOrderButton orderId={order.id} iconOnly />
                      ) : order.status === "AWAITING_TRACKING" ? (
                        <span style={{ fontSize: "0.75rem", color: "#8B7355" }}>Awaiting tracking</span>
                      ) : order.status === "SHIPPED" && order.trackingId ? (
                        <span className={styles.trackingId}>Track: {order.trackingId}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {(() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (statusFilter) params.set("status", statusFilter);
                if (from) params.set("from", from);
                if (to) params.set("to", to);
                params.set("page", String(page - 1));
                return (
                  page > 1 && (
                    <Link href={`/dashboard/orders?${params.toString()}`} className={styles.pageLink}>
                      Previous
                    </Link>
                  )
                );
              })()}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {(() => {
                const params = new URLSearchParams();
                if (search) params.set("search", search);
                if (statusFilter) params.set("status", statusFilter);
                if (from) params.set("from", from);
                if (to) params.set("to", to);
                params.set("page", String(page + 1));
                return (
                  page < totalPages && (
                    <Link href={`/dashboard/orders?${params.toString()}`} className={styles.pageLink}>
                      Next
                    </Link>
                  )
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
