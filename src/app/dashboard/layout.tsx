"use client";
import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "../../frontend/components/layout/Sidebar/Sidebar";
import styles from "./layout.module.css";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Inventory", href: "/dashboard/inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { label: "Orders", href: "/dashboard/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { label: "Statistics", href: "/dashboard/statistics", icon: "M3 13h2v10H3zm7-6h2v16h-2zm7 3h2v13h-2z" },
  { label: "Reservations", href: "/dashboard/reservations", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar navItems={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.content}>
        <header className={styles.topbar}>
          <button onClick={() => setSidebarOpen(true)} className={styles.menuBtn}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className={styles.topbarRight}>
            <Link href="/" className={styles.backLink}>Back to Bonzai</Link>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}