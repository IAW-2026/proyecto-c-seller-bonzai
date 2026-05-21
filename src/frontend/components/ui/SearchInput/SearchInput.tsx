"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <input
      type="text"
      defaultValue={defaultValue || ""}
      onChange={handleChange}
      placeholder={placeholder || "Search..."}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "0.6rem 0.75rem",
        fontSize: "0.85rem",
        border: "1.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        outline: "none",
        fontFamily: "inherit",
        color: "var(--color-text)",
        transition: "border-color 0.2s ease",
      }}
      onFocus={(e) => { e.target.style.borderColor = "var(--color-primary)"; }}
      onBlur={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
    />
  );
}
