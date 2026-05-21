import { Skeleton } from "../ui/Skeleton/Skeleton";

export function StatisticsSkeleton() {
  return (
    <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem", borderLeft: "2px solid #1B3D2F", paddingLeft: "2rem" }}>
        <Skeleton height="2.5rem" width="280px" />
        <div style={{ marginTop: "0.5rem" }}><Skeleton height="0.9rem" width="200px" /></div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ border: "1px solid #e8ece9", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <Skeleton width="2.25rem" height="2.25rem" style={{ borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <Skeleton height="1.5rem" width="60%" />
              <div style={{ marginTop: "0.25rem" }}><Skeleton height="0.6rem" width="40%" /></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ border: "1px solid #e8ece9", padding: "1.25rem" }}>
            <Skeleton height="0.9rem" width="160px" style={{ marginBottom: "1rem" }} />
            <Skeleton height="260px" style={{ borderRadius: "4px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
