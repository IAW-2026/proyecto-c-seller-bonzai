"use client";

import { useState } from "react";

export function ShipButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShip = async () => {
    if (!tracking.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", trackingId: tracking.trim() }),
      });
      if (res.ok) {
        setOpen(false);
        window.location.reload();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(true)}
        className="shipBtn"
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 600,
          padding: "0.4rem 0.75rem",
          background: "var(--color-primary)",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Ship
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 0.5rem)",
            background: "white",
            border: "1.5px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem",
            zIndex: 50,
            minWidth: "260px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text)" }}>
            Tracking Number
          </div>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. TRACK123456"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "0.5rem 0.75rem",
              fontSize: "0.85rem",
              border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              outline: "none",
              fontFamily: "inherit",
              marginBottom: "0.75rem",
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
                padding: "0.4rem 0.75rem",
                background: "none",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
                color: "var(--color-text-muted)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleShip}
              disabled={!tracking.trim() || loading}
              style={{
                fontSize: "0.65rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 600,
                padding: "0.4rem 0.75rem",
                background: "var(--color-primary)",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: !tracking.trim() || loading ? 0.6 : 1,
              }}
            >
              {loading ? "Shipping..." : "Confirm Ship"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
