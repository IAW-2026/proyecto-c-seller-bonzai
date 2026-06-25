"use client";

import { useState, useEffect, useRef } from "react";
import { Package, Layers, AlertCircle, ShieldAlert, X } from "lucide-react";
import { ProductPreviewModal } from "../../../../frontend/components/products/ProductPreviewModal";
import styles from "./page.module.css";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  isFragile: boolean;
  imageUrl: string | null;
  moderationStatus: string;
  moderationNote: string | null;
  createdAt: string;
  seller: { id: string; email: string };
  category: { name: string } | null;
}

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  REMOVED_INAPPROPRIATE: "Inappropriate",
  REMOVED_COUNTERFEIT: "Counterfeit",
  REMOVED_OTHER: "Removed",
};

const statusReasons = [
  { value: "REMOVED_INAPPROPRIATE", label: "Inappropriate description" },
  { value: "REMOVED_COUNTERFEIT", label: "Counterfeit product" },
  { value: "REMOVED_OTHER", label: "Other reason" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modaling, setModaling] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [moderationNote, setModerationNote] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(perPage));
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const openModal = (productId: string) => {
    setModaling(productId);
    setSelectedReason("");
    setModerationNote("");
  };

  const handleModerate = async (productId: string) => {
    if (!selectedReason) return;
    setActionLoading(productId);
    try {
      await fetch(`/api/admin/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedReason, note: moderationNote || undefined }),
      });
      setModaling(null);
      await fetchProducts();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const activeCount = products.filter((p) => p.moderationStatus === "ACTIVE").length;
  const moderatedCount = products.filter((p) => p.moderationStatus !== "ACTIVE").length;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Product <span className={styles.italic}>Moderation</span>
        </h1>
        <p className={styles.welcome}>{total} product{total !== 1 ? "s" : ""} in the catalog</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Package size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total Products</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Layers size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${moderatedCount > 0 ? styles.statIconWarning : ""}`}>
            <AlertCircle size={16} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${moderatedCount > 0 ? styles.statValueWarning : ""}`}>{moderatedCount}</span>
            <span className={styles.statLabel}>Moderated</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "stretch", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search products..."
          style={{
            flex: 1, boxSizing: "border-box", padding: "0.6rem 0.75rem", fontSize: "0.85rem",
            border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)",
            outline: "none", fontFamily: "inherit", color: "var(--color-text)",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
        />
        {search && (
          <button type="button" onClick={() => { setSearch(""); setPage(1); }} title="Clear search"
            style={{
              width: "2.2rem", height: "2.2rem", borderRadius: "50%", alignSelf: "flex-end",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-muted)", border: "1px solid var(--color-border)",
              background: "none", cursor: "pointer", padding: 0, flexShrink: 0,
            }}>
            <X size={13} />
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : products.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No products in catalog</p>
          <p className={styles.emptyHint}>Products will appear once sellers add them</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderCell}>
                <span className={styles.headerIcon} />
                Product
              </span>
              <span className={styles.tableHeaderCell}>Seller</span>
              <span className={styles.tableHeaderCell}>Price</span>
              <span className={styles.tableHeaderCell}>Status</span>
              <span className={styles.tableHeaderCell}>Actions</span>
            </div>
            {products.map((product) => (
              <div key={product.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                    <div className={styles.productInfo}>
                      <ShieldAlert size={14} className={styles.productIcon} />
                      <div>
                        <ProductPreviewModal product={product}>
                          <span className={styles.productName}>{product.name}</span>
                        </ProductPreviewModal>
                        {product.description && (
                          <span className={styles.productDesc}>{product.description}</span>
                        )}
                      </div>
                    </div>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.sellerEmail}>{product.seller.email}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={`${styles.badge} ${
                    product.moderationStatus === "ACTIVE" ? styles.badgeActive :
                    styles.badgeRemoved
                  }`}>
                    {statusLabels[product.moderationStatus] || product.moderationStatus}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  {product.moderationStatus === "ACTIVE" ? (
                    <button
                      onClick={() => openModal(product.id)}
                      className={styles.moderateBtn}
                    >
                      Moderate
                    </button>
                  ) : (
                    <span className={styles.moderatedNote}>
                      {product.moderationNote || statusLabels[product.moderationStatus]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <button className={styles.pageLink} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
              )}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <button className={styles.pageLink} onClick={() => setPage(page + 1)}>
                  Next
                </button>
              )}
            </div>
          )}
        </>
      )}

      {modaling && (
        <div className={styles.overlay} onClick={() => setModaling(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Remove Product</h3>
            <p className={styles.modalDesc}>Select a reason for removing this product.</p>
            <div className={styles.modalOptions}>
              {statusReasons.map((r) => (
                <label key={r.value} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioText}>{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              className={styles.modalTextarea}
              placeholder="Additional note (optional)"
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button
                onClick={() => setModaling(null)}
                className={styles.modalCancel}
              >
                Cancel
              </button>
              <button
                onClick={() => handleModerate(modaling)}
                disabled={!selectedReason || actionLoading === modaling}
                className={styles.modalConfirm}
              >
                {actionLoading === modaling ? "Processing..." : "Remove Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
