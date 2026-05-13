"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  placeholder?: string;
  basePath: string;
  defaultValue?: string;
}

export function SearchInput({ placeholder = "Search...", basePath, defaultValue = "" }: SearchInputProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (value: string) => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      params.set("page", "1");
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, basePath]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => navigate(value), 300);
    },
    [navigate]
  );

  return (
    <div className={styles.wrap}>
      <input
        type="text"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={styles.input}
      />
      {defaultValue && (
        <button type="button" className={styles.clear} onClick={() => navigate("")}>
          Clear
        </button>
      )}
    </div>
  );
}
