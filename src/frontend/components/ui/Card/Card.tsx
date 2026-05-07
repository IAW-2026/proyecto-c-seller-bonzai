import type { ReactNode } from "react";
import styles from "./Card.module.css";

interface CardProps {
  children: ReactNode;
  variant?: "shadow" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

interface CardHeaderProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

const paddingMap = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
} as const;

export function Card({
  children,
  variant = "shadow",
  padding = "md",
  className,
}: CardProps) {
  const classes = [
    styles.card,
    variant === "shadow" ? styles.shadow : styles.flat,
    paddingMap[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}

export function CardHeader({ title, description, action }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        {title && <h3 className={styles.title}>{title}</h3>}
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
