import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

function getRoles(publicMetadata: unknown): string[] {
  const raw = publicMetadata as Record<string, unknown> | undefined;
  const roles = raw?.roles;
  return Array.isArray(roles) ? roles : [];
}

export async function GET() {
  try {
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
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching sellers." },
      { status: 500 }
    );
  }
}
