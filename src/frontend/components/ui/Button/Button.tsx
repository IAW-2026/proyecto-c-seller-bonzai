import { type ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variantMap = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  accent: styles.accent,
} as const;

const sizeMap = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.button,
      variantMap[variant],
      sizeMap[size],
      fullWidth ? styles.full : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
