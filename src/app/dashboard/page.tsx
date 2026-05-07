import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";
import { Package, BarChart3, ArrowUpRight } from "lucide-react";
import styles from "./page.module.css";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Merchant <span className={styles.italic}>Overview</span>
        </h1>
        <p className={styles.welcome}>
          Welcome back, {user.firstName || "Curator"}. Here is your current standing.
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><Package size={18} /></div>
            <ArrowUpRight size={14} className={styles.arrow} />
          </div>
          <h2 className={styles.cardTitle}>Inventory</h2>
          <p className={styles.cardDesc}>Manage your botanical collection and digital assets.</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><BarChart3 size={18} /></div>
            <ArrowUpRight size={14} className={styles.arrow} />
          </div>
          <h2 className={styles.cardTitle}>Performance</h2>
          <p className={styles.cardDesc}>Deep dive into your sales and revenue growth.</p>
        </div>
      </div>
    </div>
  );
}
