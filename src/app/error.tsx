"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "4rem", fontFamily: "var(--font-serif)", color: "#8B7355", lineHeight: 1 }}>Error</div>
      <div style={{ fontSize: "1rem", color: "var(--color-text-muted)", maxWidth: "400px" }}>
        Something went wrong. Please try again.
      </div>
      <button
        onClick={() => reset()}
        style={{
          fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
          padding: "0.5rem 1.25rem", background: "#8B7355", color: "white", border: "none",
          cursor: "pointer", marginTop: "0.5rem",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
