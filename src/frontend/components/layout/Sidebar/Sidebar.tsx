"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import styles from "./Sidebar.module.css";

export function Sidebar({ navItems, adminNavItems, isOpen, onClose }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.logo}>B</div>
            <span className={styles.brandName}>Bonzai</span>
          </Link>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú">
            ×
          </button>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Merchant Control</span>
          {navItems.map((item: any) => (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); onClose(); }}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
            >
              <svg className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
          {adminNavItems && adminNavItems.length > 0 && (
            <>
              <span className={styles.navLabel}>Admin</span>
              {adminNavItems.map((item: any) => (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); onClose(); }}
                  className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
                >
                  <svg className={styles.navIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {(user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || "U").toUpperCase()}
            </div>
            <div className={styles.userMeta}>
              <p className={styles.userName}>{user?.firstName || "Merchant"}</p>
              <p className={styles.userEmail}>{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          </div>
          <button onClick={() => signOut({ redirectUrl: "/" })} className={styles.logoutBtn}>
            Logout System
          </button>
        </div>
      </aside>
    </>
  );
}