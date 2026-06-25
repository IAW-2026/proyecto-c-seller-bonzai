"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

export function SearchInput({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";

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

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "stretch" }}>
      <input
        type="text"
        defaultValue={defaultValue || ""}
        onChange={handleChange}
        placeholder={placeholder || "Search..."}
        style={{
          flex: 1,
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
      {currentSearch && (
        <button
          onClick={clearSearch}
          type="button"
          title="Clear search"
          style={{
            width: "2.2rem", height: "2.2rem", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--color-text-muted)", border: "1px solid var(--color-border)",
            background: "none", cursor: "pointer", padding: 0, alignSelf: "flex-end",
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
