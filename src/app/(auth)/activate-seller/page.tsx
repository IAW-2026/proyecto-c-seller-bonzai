"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

export default function ActivateSellerPage() {
  const { isLoaded, userId, getToken } = useAuth();
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

  if (!isLoaded) return <p>Cargando...</p>;

  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2">Habilitar acceso como Seller</h1>
      <p className="text-gray-600 mb-6">
        Ya existe una cuenta asociada a {user?.emailAddresses[0]?.emailAddress}.
        ¿Deseás habilitar también acceso como Vendedor?
      </p>
      <button
        onClick={handleActivate}
        disabled={isLoading}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {isLoading ? "Activando..." : "Sí, habilitar acceso"}
      </button>
      <button
        onClick={() => router.push("/sign-in")}
        className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
    </div>
  );
}
