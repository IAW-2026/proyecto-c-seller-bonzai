"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingBag, DollarSign, Clock, CheckCircle, XCircle, Truck, Package, X } from "lucide-react";
import { OrderDetailsModal } from "../../../../frontend/components/orders/OrderDetailsModal";
import styles from "./page.module.css";

interface OrderItem {
  id: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerEmail: string | null;
  status: string;
  total: number;
  transactionId: string | null;
  trackingId: string | null;
  paidAt: string | null;
  awaitingTrackingAt: string | null;
  shippedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  items: OrderItem[];
}

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

const statusOptions = ["PENDING", "PAID", "AWAITING_TRACKING", "SHIPPED", "CANCELLED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("limit", String(perPage));
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, from, to]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrom(e.target.value);
    setPage(1);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTo(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const hasFilters = search || statusFilter || from || to;

  const allOrders = orders;
  const totalRevenue = allOrders
    .filter((o) => o.status === "PAID" || o.status === "AWAITING_TRACKING" || o.status === "SHIPPED")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = allOrders.filter((o) => o.status === "PENDING").length;
  const totalPages = Math.ceil(totalOrders / perPage);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          All <span className={styles.italic}>Orders</span>
        </h1>
        <p className={styles.welcome}>{totalOrders} order{totalOrders !== 1 ? "s" : ""} across all sellers</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><ShoppingBag size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalOrders}</span>
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
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px", minWidth: "160px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Product</label>
            <input type="text" value={search} onChange={handleSearchChange} placeholder="Search by product..."
              style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem", fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", outline: "none", fontFamily: "inherit", color: "var(--color-text)" }} />
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Status</label>
            <select value={statusFilter} onChange={handleStatusChange}
              style={{ width: "100%", padding: "0.5rem", fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", outline: "none", fontFamily: "inherit", color: "var(--color-text)", background: "white", cursor: "pointer", accentColor: "var(--color-primary)" }}>
              <option value="">All</option>
              {statusOptions.map((s) => (<option key={s} value={s}>{s.replace(/_/g, " ")}</option>))}
            </select>
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>From</label>
            <input type="date" value={from} onChange={handleFromChange}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem", fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", outline: "none", fontFamily: "inherit", color: "var(--color-text)", colorScheme: "light", accentColor: "var(--color-primary)" }} />
          </div>
          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>To</label>
            <input type="date" value={to} onChange={handleToChange}
              style={{ width: "100%", boxSizing: "border-box", padding: "0.5rem", fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", outline: "none", fontFamily: "inherit", color: "var(--color-text)", colorScheme: "light", accentColor: "var(--color-primary)" }} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} title="Clear filters"
              style={{ width: "2.2rem", height: "2.2rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", padding: 0 }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : totalOrders === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders yet</p>
          <p className={styles.emptyHint}>Orders from all sellers will appear here</p>
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
            </div>
            {allOrders.map((order) => (
              <div key={order.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <OrderDetailsModal
                    orderId={order.id}
                    status={order.status}
                    total={order.total}
                    createdAt={order.createdAt}
                    paidAt={order.paidAt}
                    awaitingTrackingAt={order.awaitingTrackingAt}
                    shippedAt={order.shippedAt}
                    cancelledAt={order.cancelledAt}
                    cancellationReason={order.cancellationReason}
                    trackingId={order.trackingId}
                    sellerEmail={order.sellerEmail}
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
              </div>
            ))}
          </div>
        </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <button className={styles.pageLink} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
              )}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <button className={styles.pageLink} onClick={() => setPage(page + 1)}>
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
