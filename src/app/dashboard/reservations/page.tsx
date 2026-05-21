import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { SearchInput } from "../../../frontend/components/ui/SearchInput/SearchInput";
import styles from "./page.module.css";

const statusIcons: Record<string, React.ReactNode> = {
  ACTIVE: <Clock size={14} />,
  COMPLETED: <CheckCircle size={14} />,
  CANCELLED: <XCircle size={14} />,
  EXPIRED: <AlertTriangle size={14} />,
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export default async function ReservationsPage(props: { searchParams?: Promise<{ search?: string; page?: string }> }) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: true, suspended: false },
    });
  }

  const searchParams = await props.searchParams;
  const search = searchParams?.search?.toLowerCase() || "";
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // Liberar reservas vencidas antes de mostrar la página
  const { releaseExpiredReservationsInBatch } = await import("../../../repositories/reservationRepository");
  await releaseExpiredReservationsInBatch();

  const productWhere: Record<string, unknown> = { sellerId: profile.id, isActive: true };
  if (search) {
    productWhere.name = { contains: search, mode: "insensitive" };
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    select: { id: true, name: true },
  });

  const productIds = products.map((p) => p.id);
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  const where = productIds.length > 0 ? { productId: { in: productIds } } : { id: "none" };

  const [reservations, total] = await Promise.all([
    productIds.length > 0
      ? prisma.reservation.findMany({
          where: { productId: { in: productIds } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        })
      : Promise.resolve([]),
    productIds.length > 0
      ? prisma.reservation.count({ where: { productId: { in: productIds } } })
      : Promise.resolve(0),
  ]);

  const totalPages = Math.ceil(total / limit);
  const activeReservations = reservations.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Product <span className={styles.italic}>Reservations</span>
        </h1>
        <p className={styles.welcome}>
          {total} reservation{total !== 1 ? "s" : ""} on your products
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Calendar size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={16} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{activeReservations}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <SearchInput defaultValue={search} placeholder="Search by product name..." />
      </div>

      {total === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>No reservations yet</p>
          <p className={styles.emptyHint}>Customer reservations for your products will appear here</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span className={styles.tableHeaderCell}>Product</span>
                <span className={styles.tableHeaderCell}>Qty</span>
                <span className={styles.tableHeaderCell}>Status</span>
                <span className={styles.tableHeaderCell}>Expires</span>
              </div>
              {reservations.map((reservation) => (
                <div key={reservation.id} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <span className={styles.productName}>
                      {productMap.get(reservation.productId) || "Unknown Product"}
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.quantity}>{reservation.quantity}</span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles[`badge${reservation.status}`] || ""}`}>
                      <span className={styles.badgeIcon}>{statusIcons[reservation.status]}</span>
                      {statusLabels[reservation.status] || reservation.status}
                    </span>
                  </div>
                  <div className={styles.tableCell}>
                    <span className={styles.expiresDate}>
                      {new Date(reservation.expiresAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <Link href={`/dashboard/reservations?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page - 1) })}`} className={styles.pageLink}>
                  Previous
                </Link>
              )}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/reservations?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page + 1) })}`} className={styles.pageLink}>
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
