"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
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
  status: string;
  total: number;
  transactionId: string | null;
  createdAt: string;
  items: OrderItem[];
}

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          All <span className={styles.italic}>Orders</span>
        </h1>
        <p className={styles.welcome}>{orders.length} order{orders.length !== 1 ? "s" : ""} across all sellers</p>
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
            <span className={styles.statValue}>{pendingCount}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : orders.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No orders yet</p>
          <p className={styles.emptyHint}>Orders from all sellers will appear here</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
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
        </div>
      )}
    </div>
  );
}
