import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem", textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "4rem", fontFamily: "var(--font-serif)", color: "var(--color-primary)", lineHeight: 1 }}>404</div>
      <div style={{ fontSize: "1rem", color: "var(--color-text-muted)", maxWidth: "400px" }}>
        The page you are looking for does not exist.
      </div>
      <Link
        href="/dashboard"
        style={{
          fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600,
          padding: "0.5rem 1.25rem", background: "var(--color-primary)", color: "white",
          textDecoration: "none", marginTop: "0.5rem",
        }}
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
