"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export function ProductRowClient({ children, className }: { children: ReactNode; className?: string }) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!revealed) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setRevealed(false);
      }
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [revealed]);

  return (
    <div
      ref={ref}
      className={className}
      data-revealed={revealed ? "true" : "false"}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, button")) return;
        setRevealed((r) => !r);
      }}
    >
      {children}
    </div>
  );
}
