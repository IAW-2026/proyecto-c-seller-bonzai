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
    <>
      <button
        onClick={() => setOpen(true)}
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
              minWidth: "320px",
              maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--color-text)" }}>
              Ship Order
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              Order #{orderId.slice(0, 8)}
            </div>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. TRACK123456"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.6rem 0.75rem",
                fontSize: "0.9rem",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: "1rem",
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 600,
                  padding: "0.5rem 1rem",
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
                  padding: "0.5rem 1rem",
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
        </div>
      )}
    </>
  );
}
