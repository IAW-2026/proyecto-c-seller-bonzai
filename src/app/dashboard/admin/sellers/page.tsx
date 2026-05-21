"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import styles from "./page.module.css";

interface Seller {
  id: string;
  clerkId: string;
  email: string;
  approved: boolean;
  suspended: boolean;
  createdAt: string;
}

export default function AdminSellersPage() {
  const [allSellers, setAllSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sellers");
      const data = await res.json();
      setAllSellers(data.sellers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleApprove = async (clerkId: string) => {
    setActionLoading(clerkId);
    try {
      await fetch(`/api/admin/sellers/${clerkId}/approve`, { method: "POST" });
      await fetchSellers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (clerkId: string) => {
    setActionLoading(clerkId);
    try {
      await fetch(`/api/admin/sellers/${clerkId}/unsuspend`, { method: "POST" });
      await fetchSellers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (clerkId: string) => {
    setActionLoading(clerkId);
    try {
      await fetch(`/api/admin/sellers/${clerkId}/suspend`, { method: "POST" });
      await fetchSellers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = allSellers.filter((s) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const sellers = filtered.slice((page - 1) * perPage, page * perPage);

  const approved = allSellers.filter((s) => s.approved && !s.suspended);
  const pending = allSellers.filter((s) => !s.approved);
  const suspended = allSellers.filter((s) => s.suspended);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Seller <span className={styles.italic}>Management</span>
        </h1>
        <p className={styles.welcome}>{allSellers.length} registered seller{allSellers.length !== 1 ? "s" : ""}</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{allSellers.length}</span>
            <span className={styles.statLabel}>Total Sellers</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckCircle size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{approved.length}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${pending.length > 0 ? styles.statIconWarning : ""}`}>
            <AlertCircle size={16} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${pending.length > 0 ? styles.statValueWarning : ""}`}>{pending.length}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${suspended.length > 0 ? styles.statIconDanger : ""}`}>
            <XCircle size={16} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${suspended.length > 0 ? styles.statValueDanger : ""}`}>{suspended.length}</span>
            <span className={styles.statLabel}>Suspended</span>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search sellers by email..."
          className={styles.searchInput}
        />
        {search && <button type="button" className={styles.clearBtn} onClick={() => { setSearch(""); setPage(1); }}>Clear</button>}
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : total === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No sellers registered</p>
          <p className={styles.emptyHint}>Sellers will appear once they sign up and activate their account</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderCell}>Seller</span>
              <span className={styles.tableHeaderCell}>Status</span>
              <span className={styles.tableHeaderCell}>Registered</span>
              <span className={styles.tableHeaderCell}>Actions</span>
            </div>
            {sellers.map((seller) => (
              <div key={seller.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <span className={styles.sellerEmail}>{seller.email}</span>
                </div>
                <div className={styles.tableCell}>
                  <span className={`${styles.badge} ${
                    seller.suspended ? styles.badgeSuspended :
                    seller.approved ? styles.badgeApproved :
                    styles.badgePending
                  }`}>
                    {seller.suspended ? "Suspended" : seller.approved ? "Approved" : "Pending"}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <span className={styles.dateText}>
                    {new Date(seller.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.tableCell}>
                  <div className={styles.actionGroup}>
                    {!seller.approved && !seller.suspended && (
                      <button
                        onClick={() => handleApprove(seller.clerkId)}
                        disabled={actionLoading === seller.clerkId}
                        className={`${styles.actionBtn} ${styles.actionApprove}`}
                      >
                        Approve
                      </button>
                    )}
                    {seller.approved && !seller.suspended && (
                      <button
                        onClick={() => handleSuspend(seller.clerkId)}
                        disabled={actionLoading === seller.clerkId}
                        className={`${styles.actionBtn} ${styles.actionSuspend}`}
                      >
                        Suspend
                      </button>
                    )}
                    {seller.suspended && (
                      <button
                        onClick={() => handleUnsuspend(seller.clerkId)}
                        disabled={actionLoading === seller.clerkId}
                        className={`${styles.actionBtn} ${styles.actionReactivate}`}
                      >
                        Reactivate
                      </button>
                    )}
                  </div>
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
    </div>
  );
}
