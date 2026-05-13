import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth-helpers";

function getRoles(publicMetadata: unknown): string[] {
  const raw = publicMetadata as Record<string, unknown> | undefined;
  const roles = raw?.roles;
  return Array.isArray(roles) ? roles : [];
}

export async function GET() {
  try {
    await requireAdmin();

    const sellers = await prisma.sellerProfile.findMany({
      orderBy: { createdAt: "desc" },
    });

    const client = await clerkClient();
    const { data: clerkUsers } = await client.users.getUserList();

    const adminClerkIds = new Set<string>();
    for (const u of clerkUsers) {
      const roles = getRoles(u.publicMetadata);
      if (roles.includes("seller_admin") || roles.includes("super_admin")) {
        adminClerkIds.add(u.id);
      }
    }

    const filtered = sellers.filter((s) => !adminClerkIds.has(s.clerkId));

    return NextResponse.json({ sellers: filtered });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching sellers." },
      { status: 500 }
    );
  }
}
