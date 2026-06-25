"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface ShipButtonProps {
  orderId: string;
  transactionId: string;
  buyerId: string;
  sellerClerkId: string;
  deliveryAddress: string;
  isFragile: boolean;
}

export function ShipButton({ orderId, transactionId, buyerId, sellerClerkId, deliveryAddress, isFragile }: ShipButtonProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleShip = async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();

      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ship",
          clerkToken: token,
          transactionId,
          buyerId,
          sellerClerkId,
          deliveryAddress,
          type: isFragile ? "FRAGIL" : "OTROS",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.refresh();
      } else {
        setError(data.message || "Could not ship order.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
      <button
        onClick={handleShip}
        disabled={loading}
        style={{
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontWeight: 600,
          padding: "0.4rem 0.75rem",
          background: loading ? "#ccc" : "var(--color-primary)",
          color: "white",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Shipping..." : "Ship"}
      </button>
      {error && <span style={{ fontSize: "0.65rem", color: "#8B7355" }}>{error}</span>}
    </div>
  );
}