import type { ReactNode } from "react";
import styles from "./Badge.module.css";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
  className?: string;
}

const variantMap = {
  default: styles.default,
  primary: styles.primary,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
} as const;

const sizeMap = {
  sm: styles.sm,
  md: styles.md,
} as const;

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  const classes = [styles.badge, variantMap[variant], sizeMap[size], className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
