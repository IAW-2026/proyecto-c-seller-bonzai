import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Layers, CircleAlert, Plus, Pencil, Eye } from "lucide-react";
import { SearchInput } from "../../../frontend/components/ui/SearchInput/SearchInput";
import { DeleteProductButton } from "../../../frontend/components/products/DeleteProductButton";
import { ToggleProductButton } from "../../../frontend/components/products/ToggleProductButton";
import { ProductPreviewModal } from "../../../frontend/components/products/ProductPreviewModal";
import { ProductRowClient } from "../../../frontend/components/products/ProductRowClient";
import styles from "./page.module.css";

export default async function InventoryPage(props: { searchParams?: Promise<{ search?: string; page?: string }> }) {
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

  const where: Record<string, unknown> = { sellerId: profile.id, isActive: true };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const include = { category: true } as const;
  const [products, total, allProducts] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, include, skip, take: limit }),
    prisma.product.count({ where }),
    prisma.product.findMany({ where: { sellerId: profile.id, isActive: true }, orderBy: { createdAt: "desc" }, include }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const totalStock = allProducts.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = allProducts.filter((p) => p.stock === 0).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              Product <span className={styles.italic}>Inventory</span>
            </h1>
            <p className={styles.welcome}>
              {total} product{total !== 1 ? "s" : ""} in your catalog
            </p>
          </div>
          <Link href="/dashboard/inventory/new" className={styles.addBtn}>
            <Plus size={14} />
            New Product
          </Link>
        </div>
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
            <span className={styles.statValue}>{totalStock}</span>
            <span className={styles.statLabel}>Units in Stock</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${outOfStock > 0 ? styles.statIconWarning : ""}`}>
            <CircleAlert size={16} />
          </div>
          <div className={styles.statInfo}>
            <span className={`${styles.statValue} ${outOfStock > 0 ? styles.statValueWarning : ""}`}>{outOfStock}</span>
            <span className={styles.statLabel}>Out of Stock</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <SearchInput defaultValue={search} placeholder="Search products..." />
      </div>

      {total === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Your inventory is empty</p>
          <p className={styles.emptyHint}>Products you add will appear here</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span className={styles.tableHeaderCell}>Product</span>
                <span className={styles.tableHeaderCell}>Price</span>
                <span className={styles.tableHeaderCell}>Stock</span>
                <span className={styles.tableHeaderCell}>Status</span>
              </div>
              {products.map((product) => (
                <ProductRowClient key={product.id} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <div className={styles.productInfo}>
                      <div className={styles.productImage}>
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
                        ) : (
                          <div className={styles.productImgPlaceholder}>
                            <Package size={14} />
                          </div>
                        )}
                        <ProductPreviewModal product={product}>
                          <div className={styles.imagePreviewOverlay}>
                            <Eye size={12} />
                          </div>
                        </ProductPreviewModal>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Link href={`/dashboard/inventory/${product.id}/edit`} className={styles.productNameLink}>
                            <span className={styles.productName}>{product.name}</span>
                            <Pencil size={10} className={styles.editIcon} />
                          </Link>
                          <ToggleProductButton productId={product.id} suspended={product.suspended} />
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellPrice}`}>
                    <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellStock}`}>
                    <span className={`${styles.productStock} ${product.stock === 0 ? styles.stockEmpty : ""}`}>
                      {product.stock}
                    </span>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellStatus}`}>
                    {product.suspended ? (
                      <span className={`${styles.badge} ${styles.badgeSuspended}`}>
                        Suspended
                      </span>
                    ) : (
                      <span className={`${styles.badge} ${product.stock > 0 ? styles.badgeActive : styles.badgeInactive}`}>
                        {product.stock > 0 ? "Active" : "Depleted"}
                      </span>
                    )}
                  </div>
                </ProductRowClient>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <Link href={`/dashboard/inventory?${new URLSearchParams({ page: String(page - 1), ...(search ? { search } : {}) })}`} className={styles.pageLink}>
                  Previous
                </Link>
              )}
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/inventory?${new URLSearchParams({ page: String(page + 1), ...(search ? { search } : {}) })}`} className={styles.pageLink}>
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
