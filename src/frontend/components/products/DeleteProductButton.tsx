"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
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
        title="Delete product"
        className="deleteBtn"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#b8860b",
          padding: "0.15rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Trash2 size={12} />
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
              Delete Product
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1.25rem" }}>
              Are you sure you want to delete <strong>{productName}</strong>? This action cannot be undone.
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
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
                  fontWeight: 600, padding: "0.5rem 1rem", background: "var(--color-error)",
                  color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
