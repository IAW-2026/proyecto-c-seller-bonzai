"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./Header.module.css";

interface NavItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navItems?: NavItem[];
  actions?: ReactNode;
}

export function Header({ navItems, actions }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>
        <div className={styles.logo}>B</div>
        <span className={styles.brandName}>Bonzai</span>
      </Link>

      {navItems && navItems.length > 0 && (
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${pathname === item.href ? styles.linkActive : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
