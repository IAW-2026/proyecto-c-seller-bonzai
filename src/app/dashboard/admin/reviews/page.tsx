"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Leaf } from "lucide-react";
import { Skeleton } from "../../../../frontend/components/ui/Skeleton/Skeleton";
import styles from "./page.module.css";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  seller: { email: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?page=${p}&limit=10`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      fetchReviews(page);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>Review Management</h1>
        <p className={styles.welcome}>{reviews.length} review{reviews.length !== 1 ? "s" : ""} loaded</p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><MessageSquare size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total Reviews</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div style={{ flex: 1 }}>
                  <Skeleton height="0.85rem" width="40%" />
                  <div style={{ marginTop: "0.25rem" }}><Skeleton height="0.6rem" width="30%" /></div>
                </div>
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <Skeleton height="0.8rem" width="60%" />
              </div>
              <Skeleton height="0.8rem" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className={styles.emptyText}>No reviews yet.</p>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div>
                  <span className={styles.reviewerEmail}>{review.seller.email}</span>
                  <span className={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(review.id)}
                  title="Delete review"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Leaf
                    key={n}
                    size={14}
                    fill={n <= review.rating ? "var(--color-primary-light)" : "none"}
                    color={n <= review.rating ? "var(--color-primary)" : "var(--color-text-muted)"}
                    strokeWidth={n <= review.rating ? 2 : 1.5}
                  />
                ))}
              </div>
              <p className={styles.reviewComment}>{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
