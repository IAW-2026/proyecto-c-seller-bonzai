"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function ActivateSellerPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const rawRoles = (user.publicMetadata as any)?.roles;
    const roles: string[] = Array.isArray(rawRoles)
      ? rawRoles
      : rawRoles && typeof rawRoles === "object"
        ? Object.values(rawRoles)
        : [];

    if (roles.includes("seller")) {
      router.push("/dashboard");
    }
  }, [isLoaded, user, router]);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/activate-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "seller" }),
      });

      if (!res.ok) throw new Error("Error al activar rol");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle} />
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.iconWrapper}>
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h1 className={styles.title}>Habilitar acceso como Seller</h1>
      <p className={styles.description}>
        Ya existe una cuenta asociada a <strong className={styles.highlight}>{user?.emailAddresses[0]?.emailAddress}</strong>.
        ¿Deseás habilitar también acceso como vendedor?
      </p>
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className={styles.activateBtn}
      >
        {isLoading ? "Activando..." : "Sí, habilitar acceso"}
      </button>
      <button
        onClick={() => router.push("/sign-in")}
        className={styles.cancelBtn}
      >
        Cancelar
      </button>
    </div>
  );
}
