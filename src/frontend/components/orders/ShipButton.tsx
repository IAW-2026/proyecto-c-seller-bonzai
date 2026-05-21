"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ShipButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleShip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShip}
      disabled={loading}
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
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "Shipping..." : "Ship"}
    </button>
  );
}
