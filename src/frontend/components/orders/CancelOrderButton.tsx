"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOpen(false);
        router.refresh();
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
        disabled={loading}
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 600,
          padding: "0.4rem 0.75rem",
          background: "none",
          border: "1px solid rgba(217,119,6,0.3)",
          color: "#d97706",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          transition: "background 0.2s, border-color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(217,119,6,0.08)"; e.currentTarget.style.borderColor = "rgba(217,119,6,0.5)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(217,119,6,0.3)"; }}
      >
        <XCircle size={12} />
        Cancel
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)", padding: "1.5rem",
              minWidth: "320px", maxWidth: "90vw",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.25rem", color: "var(--color-text)" }}>
              Cancel Order
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Are you sure you want to cancel this order? Stock will be restored.
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{
                  fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
                  fontWeight: 600, padding: "0.5rem 1rem", background: "none",
                  border: "1px solid var(--color-border)", cursor: "pointer", color: "var(--color-text-muted)",
                }}
              >
                Keep
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
                  fontWeight: 600, padding: "0.5rem 1rem", background: "#d97706",
                  color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#b85e00"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#d97706"; }}
              >
                {loading ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
