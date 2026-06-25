"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye } from "lucide-react";

export function ToggleProductButton({ productId, suspended }: { productId: string; suspended: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !suspended }),
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
      onClick={handleToggle}
      disabled={loading}
      title={suspended ? "Reactivate product" : "Suspend product"}
      className="toggleBtn"
      style={{
        background: "none",
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        color: suspended ? "var(--color-success)" : "#b8860b",
        padding: "0.15rem",
        display: "flex",
        alignItems: "center",
      }}
    >
      {suspended ? <Eye size={12} /> : <EyeOff size={12} />}
    </button>
  );
}
