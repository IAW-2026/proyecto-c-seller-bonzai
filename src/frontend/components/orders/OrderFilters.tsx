"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";

const statuses = ["PENDING", "PAID", "AWAITING_TRACKING", "SHIPPED", "CANCELLED"];

export function OrderFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const searchParam = sp.get("search") || "";
  const statusParam = sp.get("status") || "";
  const fromParam = sp.get("from") || "";
  const toParam = sp.get("to") || "";

  const [search, setSearch] = useState(searchParam);
  const [status, setStatus] = useState(statusParam);
  const [from, setFrom] = useState(fromParam);
  const [to, setTo] = useState(toParam);

  useEffect(() => { setSearch(searchParam); }, [searchParam]);
  useEffect(() => { setStatus(statusParam); }, [statusParam]);
  useEffect(() => { setFrom(fromParam); }, [fromParam]);
  useEffect(() => { setTo(toParam); }, [toParam]);

  const hasFilters = search || status || from || to;
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buildParams = useCallback(
    (overrides: Record<string, string>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      params.set("page", "1");
      return params.toString();
    },
    [sp]
  );

  const navigate = useCallback(
    (overrides: Record<string, string>) => {
      router.push(`?${buildParams(overrides)}`);
    },
    [router, buildParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      navigate({ search: value, status, from, to });
    }, 250);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatus(value);
    navigate({ search, status: value, from, to });
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <style>{`
        .order-filters select { accent-color: #1B3D2F; }
        .order-filters select:focus { border-color: #1B3D2F; box-shadow: 0 0 0 2px rgba(27,61,47,0.15); }
        .order-filters input[type="date"] { accent-color: #1B3D2F; color-scheme: light; }
        .order-filters input[type="date"]:focus { border-color: #1B3D2F; box-shadow: 0 0 0 2px rgba(27,61,47,0.15); }
        .order-filters input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.3) sepia(1) hue-rotate(100deg); cursor: pointer; }
      `}</style>
      <div className="order-filters">
        <div style={{
          display: "flex", gap: "0.5rem",
          flexWrap: "wrap", alignItems: "flex-end",
        }}>
          <div style={{ flex: "1 1 200px", minWidth: "160px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Product
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by product..."
                style={{
                  width: "100%", boxSizing: "border-box", padding: "0.5rem",
                  fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                  outline: "none", fontFamily: "inherit", color: "var(--color-text)",
                }}
              />
            </div>
          </div>

          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              Status
            </label>
            <select
              value={status}
              onChange={handleStatusChange}
              style={{
                width: "100%", padding: "0.5rem", fontSize: "0.8rem",
                border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                outline: "none", fontFamily: "inherit", color: "var(--color-text)",
                background: "white", cursor: "pointer",
                accentColor: "var(--color-primary)",
              }}
            >
              <option value="">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "0.5rem",
                fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                outline: "none", fontFamily: "inherit", color: "var(--color-text)",
                colorScheme: "light", accentColor: "var(--color-primary)",
              }}
            />
          </div>

          <div style={{ minWidth: "130px" }}>
            <label style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "0.5rem",
                fontSize: "0.8rem", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)",
                outline: "none", fontFamily: "inherit", color: "var(--color-text)",
                colorScheme: "light", accentColor: "var(--color-primary)",
              }}
            />
          </div>

          {hasFilters && (
            <Link
              href="/dashboard/orders"
              onClick={() => { setSearch(""); setStatus(""); setFrom(""); setTo(""); }}
              title="Clear all filters"
              style={{
                width: "2.2rem", height: "2.2rem", borderRadius: "50%",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-text-muted)", border: "1px solid var(--color-border)",
                textDecoration: "none", flexShrink: 0,
              }}
            >
              <X size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}