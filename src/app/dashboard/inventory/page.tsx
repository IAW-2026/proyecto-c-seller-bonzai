import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Layers, CircleAlert, Plus, Pencil } from "lucide-react";
import styles from "./page.module.css";

export default async function InventoryPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });
  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: { clerkId: userId, email: user.emailAddresses[0]?.emailAddress || "", approved: false, suspended: false },
    });
  }

  const products = await prisma.product.findMany({
    where: { sellerId: profile.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>
              Product <span className={styles.italic}>Inventory</span>
            </h1>
            <p className={styles.welcome}>
              {products.length} product{products.length !== 1 ? "s" : ""} in your catalog
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
            <span className={styles.statValue}>{products.length}</span>
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

      {products.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyText}>Your inventory is empty</p>
          <p className={styles.emptyHint}>Products you add will appear here</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderCell}>Product</span>
              <span className={styles.tableHeaderCell}>Price</span>
              <span className={styles.tableHeaderCell}>Stock</span>
              <span className={styles.tableHeaderCell}>Status</span>
            </div>
            {products.map((product) => (
              <div key={product.id} className={styles.tableRow}>
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
                    </div>
                    <div>
                      <Link href={`/dashboard/inventory/${product.id}/edit`} className={styles.productNameLink}>
                        <span className={styles.productName}>{product.name}</span>
                        <Pencil size={10} className={styles.editIcon} />
                      </Link>
                      {product.description && (
                        <span className={styles.productDesc}>{product.description}</span>
                      )}
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
                  <span className={`${styles.badge} ${product.stock > 0 ? styles.badgeActive : styles.badgeInactive}`}>
                    {product.stock > 0 ? "Active" : "Depleted"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
