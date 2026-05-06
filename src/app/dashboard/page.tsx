import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../lib/prisma";
import { redirect } from "next/navigation";

async function ensureSellerProfile(userId: string, email: string) {
  let profile = await prisma.sellerProfile.findUnique({ where: { clerkId: userId } });

  if (!profile) {
    profile = await prisma.sellerProfile.create({
      data: {
        clerkId: userId,
        email,
        approved: false,
        suspended: false,
      },
    });
  }

  return profile;
}

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/sign-in");

  await ensureSellerProfile(userId, user.emailAddresses[0]?.emailAddress || "");

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Panel de Vendedor</h1>
      <p className="text-gray-600 mb-6">
        Bienvenido, {user.firstName || user.emailAddresses[0]?.emailAddress}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Mis Productos</h2>
          <p className="text-gray-500">Gestiona tu catálogo y stock.</p>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Órdenes</h2>
          <p className="text-gray-500">Revisa y procesa pedidos entrantes.</p>
        </div>
      </div>
    </main>
  );
}
