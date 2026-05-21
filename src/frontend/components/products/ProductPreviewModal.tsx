"use client";

import { useState, type ReactNode } from "react";
import { X, Package } from "lucide-react";

interface ProductPreviewModalProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    isFragile: boolean;
    category: { name: string } | null;
    moderationStatus: string;
  };
  children: ReactNode;
}

export function ProductPreviewModal({ product, children }: ProductPreviewModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
            overflowY: "auto", padding: "1rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-lg)", padding: 0,
              width: "min(480px, calc(100vw - 2rem))",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, color: "var(--color-text-muted)" }}>
                Product Preview
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0, display: "flex" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{
                width: "100%", height: "220px", borderRadius: "var(--radius-lg)",
                overflow: "hidden", marginBottom: "1.25rem", background: "rgba(27,61,47,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Package size={48} style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
                )}
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 500, color: "var(--color-primary)", margin: 0 }}>
                  {product.name}
                </h2>
                {product.category && (
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>
                    {product.category.name}
                  </span>
                )}
              </div>

              <div style={{ fontSize: "1.75rem", fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1rem" }}>
                ${product.price.toFixed(2)}
              </div>

              {product.description && (
                <p style={{ fontSize: "0.85rem", color: "var(--color-text)", lineHeight: 1.6, margin: "0 0 1rem" }}>
                  {product.description}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <span style={{
                  fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                  padding: "0.25rem 0.5rem", border: "1px solid",
                  color: product.stock > 0 ? "var(--color-success)" : "var(--color-error)",
                  borderColor: product.stock > 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)",
                  background: product.stock > 0 ? "rgba(22,163,74,0.05)" : "rgba(220,38,38,0.05)",
                }}>
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
                {product.isFragile && (
                  <span style={{
                    fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                    padding: "0.25rem 0.5rem", border: "1px solid rgba(184,134,11,0.2)",
                    color: "#b8860b", background: "rgba(184,134,11,0.05)",
                  }}>
                    Fragile
                  </span>
                )}
                {product.moderationStatus !== "ACTIVE" && (
                  <span style={{
                    fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
                    padding: "0.25rem 0.5rem", border: "1px solid rgba(220,38,38,0.2)",
                    color: "var(--color-error)", background: "rgba(220,38,38,0.05)",
                  }}>
                    {product.moderationStatus.replace("REMOVED_", "")}
                  </span>
                )}
              </div>

              <button
                disabled
                style={{
                  width: "100%", padding: "0.75rem", fontSize: "0.8rem", fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  background: "var(--color-primary)", color: "white", border: "none",
                  borderRadius: "var(--radius-lg)", cursor: "not-allowed", opacity: 0.5,
                  fontFamily: "inherit",
                }}
              >
                Add to Cart
              </button>
              <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                This is how your product appears to buyers
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
