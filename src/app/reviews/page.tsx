"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, Leaf, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "../../frontend/components/layout/Header/Header";
import { Button } from "../../frontend/components";
import { Skeleton } from "../../frontend/components/ui/Skeleton/Skeleton";
import Link from "next/link";
import styles from "./page.module.css";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  seller: { email: string };
}

export default function ReviewsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<Review | null | undefined>(undefined);

  const rawRoles = (user?.publicMetadata as any)?.roles;
  const roles: string[] = Array.isArray(rawRoles) ? rawRoles : [];
  const isSeller = roles.includes("seller") || roles.includes("seller_admin");
  const isAdmin = roles.includes("seller_admin") || roles.includes("super_admin");

  const fetchReviews = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?page=${p}&limit=10`);
      const data = await res.json();
      setReviews(data.reviews || []);
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

  useEffect(() => {
    if (isSeller) {
      fetch("/api/reviews/mine")
        .then((r) => r.json())
        .then((data) => setMyReview(data.review))
        .catch(() => {});
    }
  }, [isSeller]);

  const handleSubmit = async () => {
    if (rating === 0 || !comment.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (res.ok) {
        setMessage("Review submitted!");
        setRating(0);
        setComment("");
        fetchReviews(1);
        setPage(1);
      } else {
        const data = await res.json();
        setMessage(data.error === "VALIDATION_ERROR" ? "Rating 1-5, comment max 500 characters." : "Error submitting review.");
      }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

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
      <Header
        actions={
          <>
            {isSignedIn ? (
              <Link href="/dashboard"><Button variant="primary">Dashboard</Button></Link>
            ) : (
              <>
                <Link href="/sign-in"><Button variant="ghost">Seller Login</Button></Link>
                <Link href="/sign-up"><Button variant="primary">Start Selling</Button></Link>
              </>
            )}
          </>
        }
      />

      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>Seller Reviews</h1>
          <p className={styles.subtitle}>What sellers think about Bonzai</p>
        </header>

        {!isLoaded ? null : isSeller && myReview ? (
          <section className={styles.formSection}>
            <h2 className={styles.formTitle}>You already left a review</h2>
            <div className={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Leaf
                  key={n}
                  size={16}
                  fill={n <= myReview.rating ? "var(--color-primary-light)" : "none"}
                  color={n <= myReview.rating ? "var(--color-primary)" : "var(--color-text-muted)"}
                  strokeWidth={n <= myReview.rating ? 2 : 1.5}
                />
              ))}
            </div>
            <p className={styles.reviewComment}>{myReview.comment}</p>
          </section>
        ) : null}

        {isSeller && myReview === null && (
          <section className={styles.formSection}>
            <h2 className={styles.formTitle}>Leave your review</h2>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.starBtn}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Leaf
                    size={22}
                    fill={n <= (hoverRating || rating) ? "var(--color-primary-light)" : "none"}
                    color={n <= (hoverRating || rating) ? "var(--color-primary)" : "var(--color-text-muted)"}
                    strokeWidth={n <= (hoverRating || rating) ? 2 : 1.5}
                  />
                </button>
              ))}
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className={styles.formFooter}>
              <span className={styles.charCount}>{comment.length}/500</span>
              <button
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={rating === 0 || !comment.trim() || submitting}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
            {message && <p className={styles.message}>{message}</p>}
          </section>
        )}

        {!isSignedIn && isLoaded && (
          <section className={styles.loginPrompt}>
            <p>Want to leave a review?</p>
            <Link href="/sign-up"><Button variant="primary">Become a Seller</Button></Link>
          </section>
        )}

        {isLoaded && isSignedIn && !isSeller && (
          <section className={styles.loginPrompt}>
            <p>Only sellers can leave reviews.</p>
          </section>
        )}

        <section className={styles.reviewsSection}>
          {loading ? (
            <div className={styles.skeletonList}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <Skeleton width="2rem" height="2rem" style={{ borderRadius: "50%" }} />
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
            <p className={styles.emptyText}>No reviews yet. Be the first!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewerInfo}>
                    <div className={styles.reviewerAvatar}>
                      {review.seller.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={styles.reviewerName}>{review.seller.email.split("@")[0]}</span>
                      <span className={styles.reviewDate}>
                        {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(review.id)}
                      title="Delete review"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Leaf
                      key={n}
                      size={16}
                      fill={n <= review.rating ? "var(--color-primary-light)" : "none"}
                      color={n <= review.rating ? "var(--color-primary)" : "var(--color-text-muted)"}
                      strokeWidth={n <= review.rating ? 2 : 1.5}
                    />
                  ))}
                </div>
                <p className={styles.reviewComment}>{review.comment}</p>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
