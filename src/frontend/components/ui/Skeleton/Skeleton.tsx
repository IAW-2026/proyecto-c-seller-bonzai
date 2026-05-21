import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

export function Skeleton({ width, height, style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return (
    <div
      className={styles.skeleton}
      style={{ width: width ?? "100%", height: height ?? "1rem", ...style }}
    />
  );
}
