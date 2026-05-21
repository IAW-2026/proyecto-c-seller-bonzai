"use client";

import { useState, type ReactNode } from "react";
import { X, Clock, CheckCircle, Truck, XCircle, Package } from "lucide-react";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderDetailsModalProps {
  orderId: string;
  status: string;
  total: number;
  createdAt: string;
  paidAt?: string | null;
  awaitingTrackingAt?: string | null;
  shippedAt?: string | null;
  cancelledAt?: string | null;
  trackingId: string | null;
  sellerEmail?: string | null;
  cancellationReason?: string | null;
  items: OrderItem[];
  children: ReactNode;
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  AWAITING_TRACKING: "Awaiting",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

const statusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock size={14} />,
  PAID: <CheckCircle size={14} />,
  AWAITING_TRACKING: <Package size={14} />,
  SHIPPED: <Truck size={14} />,
  CANCELLED: <XCircle size={14} />,
};

const statusOrder = ["PENDING", "PAID", "AWAITING_TRACKING", "SHIPPED", "CANCELLED"] as const;

function getTimelineEvents(props: OrderDetailsModalProps) {
  const events: { status: string; timestamp: string | null; label: string }[] = [];
  if (props.createdAt) events.push({ status: "PENDING", timestamp: props.createdAt, label: "Order placed" });
  if (props.paidAt) events.push({ status: "PAID", timestamp: props.paidAt, label: "Payment confirmed" });
  if (props.awaitingTrackingAt) events.push({ status: "AWAITING_TRACKING", timestamp: props.awaitingTrackingAt, label: "Ready for tracking" });
  if (props.shippedAt) events.push({ status: "SHIPPED", timestamp: props.shippedAt, label: "Shipped" });
  if (props.cancelledAt) events.push({ status: "CANCELLED", timestamp: props.cancelledAt, label: props.cancellationReason ? `Cancelled: ${props.cancellationReason}` : "Cancelled" });
  return events.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

function OrderTimeline({ events, currentStatus }: { events: { status: string; timestamp: string | null; label: string }[]; currentStatus: string }) {
  const currentIndex = statusOrder.indexOf(currentStatus as typeof statusOrder[number]);
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", fontWeight: 600, marginBottom: "0.75rem" }}>Timeline</div>
      <div style={{ position: "relative", paddingLeft: "1.25rem" }}>
        <div style={{ position: "absolute", left: "0.35rem", top: "0.3rem", bottom: "0.3rem", width: "1.5px", background: "var(--color-border)" }} />
        {events.map((event, i) => {
          const idx = statusOrder.indexOf(event.status as typeof statusOrder[number]);
          const completed = idx <= currentIndex && currentStatus !== "CANCELLED" ? event.status !== "CANCELLED" : idx <= currentIndex;
          const isCancelled = event.status === "CANCELLED";
          return (
            <div key={i} style={{ position: "relative", paddingBottom: i < events.length - 1 ? "0.75rem" : 0 }}>
              <div style={{ position: "absolute", left: "-1.05rem", top: "0.15rem", width: "0.6rem", height: "0.6rem", borderRadius: "50%", background: completed ? (isCancelled ? "#8B7355" : "var(--color-primary)") : "var(--color-border)", border: "2px solid white", boxShadow: "0 0 0 1px var(--color-border)" }} />
              <div style={{ fontSize: "0.78rem", fontWeight: completed ? 500 : 400, color: completed ? "var(--color-text)" : "var(--color-text-muted)" }}>{event.label}</div>
              {event.timestamp && (
                <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                  {new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderDetailsModal(props: OrderDetailsModalProps) {
  const { orderId, status, total, createdAt, trackingId, sellerEmail, items, children } = props;
  const [open, setOpen] = useState(false);
  const timelineEvents = getTimelineEvents(props);

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.5rem",
              minWidth: "420px",
              maxWidth: "90vw",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-text)" }}>
                  Order #{orderId.slice(0, 8)}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  {new Date(createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, padding: "0.25rem 0.5rem", border: "1px solid", marginBottom: "1.25rem",
              color: status === "PENDING" ? "#8B7355" : status === "PAID" ? "var(--color-success)" : status === "AWAITING_TRACKING" ? "#8B7355" : status === "SHIPPED" ? "var(--color-primary)" : "#8B7355",
              borderColor: status === "PENDING" ? "rgba(139,115,85,0.2)" : status === "PAID" ? "rgba(22,163,74,0.2)" : status === "AWAITING_TRACKING" ? "rgba(139,115,85,0.2)" : status === "SHIPPED" ? "rgba(27,61,47,0.2)" : "rgba(139,115,85,0.2)",
              background: status === "PENDING" ? "rgba(139,115,85,0.05)" : status === "PAID" ? "rgba(22,163,74,0.05)" : status === "AWAITING_TRACKING" ? "rgba(139,115,85,0.05)" : status === "SHIPPED" ? "rgba(27,61,47,0.05)" : "rgba(139,115,85,0.05)",
            }}>
              {statusIcons[status]}
              {statusLabels[status] || status}
            </div>

            <OrderTimeline events={timelineEvents} currentStatus={status} />

            {sellerEmail && (
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontWeight: 500 }}>Seller:</span>
                <span>{sellerEmail}</span>
              </div>
            )}

            {trackingId && (
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontWeight: 500 }}>Tracking:</span>
                <strong>{trackingId}</strong>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0.5rem 0.5rem 0", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", fontWeight: 600 }}>Product</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", fontWeight: 600 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0.5rem", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", fontWeight: 600 }}>Price</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0 0.5rem 0.5rem", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", fontWeight: 600 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: i < items.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <td style={{ padding: "0.5rem 0.5rem 0.5rem 0", color: "var(--color-text)" }}>{item.productName}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-text)" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0.5rem", color: "var(--color-text-muted)" }}>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0 0.5rem 0.5rem", fontWeight: 500 }}>${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: "right", padding: "0.75rem 0.5rem 0 0", fontWeight: 600, fontSize: "0.85rem" }}>Total</td>
                  <td style={{ textAlign: "right", padding: "0.75rem 0 0 0.5rem", fontWeight: 700, fontSize: "0.95rem", color: "var(--color-primary)" }}>${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
