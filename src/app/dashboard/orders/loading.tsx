import { Skeleton } from "../../../frontend/components/ui/Skeleton/Skeleton";

export default function OrdersLoading() {
  return (
    <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem", borderLeft: "2px solid #1B3D2F", paddingLeft: "2rem" }}>
        <Skeleton height="2.5rem" width="200px" />
        <div style={{ marginTop: "0.5rem" }}><Skeleton height="0.9rem" width="160px" /></div>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ border: "1px solid #e8ece9", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <Skeleton width="2rem" height="2rem" />
            <div style={{ flex: 1 }}>
              <Skeleton height="1.2rem" width="40%" />
              <div style={{ marginTop: "0.25rem" }}><Skeleton height="0.6rem" width="50%" /></div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "1.5rem" }}><Skeleton height="2.5rem" /></div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ borderBottom: "1px solid #e8ece9", padding: "1rem 0" }}>
          <Skeleton height="1rem" width="60%" />
        </div>
      ))}
    </div>
  );
}
