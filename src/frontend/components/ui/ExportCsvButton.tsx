"use client";

import { Download } from "lucide-react";
import { exportCsv } from "../../lib/exportCsv";

export function ExportCsvButton({ filename, headers, rows, label }: { filename: string; headers: string[]; rows: string[][]; label?: string }) {
  return (
    <button
      onClick={() => exportCsv(filename, headers, rows)}
      title={`Export ${filename}`}
      style={{
        fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em",
        fontWeight: 600, padding: "0.4rem 0.75rem", background: "none",
        border: "1px solid var(--color-border)", cursor: "pointer",
        color: "var(--color-text)", display: "inline-flex", alignItems: "center", gap: "0.3rem",
        whiteSpace: "nowrap", transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text)"; }}
    >
      <Download size={12} />
      {label || "CSV"}
    </button>
  );
}
