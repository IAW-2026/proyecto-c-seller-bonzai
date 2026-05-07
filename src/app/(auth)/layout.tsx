import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.layout}>
      <div className={styles.wrapper}>
        <div className={styles.logoRow}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>B</div>
            <span className={styles.logoText}>Bonzai</span>
          </Link>
        </div>
        <div className={styles.card}>
          {children}
        </div>
      </div>
    </div>
  );
}
