import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";

const ALLOWED_ROLES = ["seller", "seller_admin"];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { role } = await req.json();
    if (!role) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Role is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "INVALID_ROLE", message: "Invalid role." },
        { status: 403 }
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const rawRoles = (user.publicMetadata as any)?.roles;
    const currentRoles: string[] = Array.isArray(rawRoles)
      ? rawRoles
      : rawRoles && typeof rawRoles === "object"
        ? Object.values(rawRoles)
        : [];

    if (!currentRoles.includes(role)) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { roles: [...currentRoles, role] },
      });
    }

    const email = user.emailAddresses[0]?.emailAddress || "";

    await prisma.sellerProfile.upsert({
      where: { clerkId: userId },
      update: { email },
      create: {
        clerkId: userId,
        email,
        approved: true,
        suspended: false,
      },
    });

    return NextResponse.json({ success: true, roles: [...currentRoles, role] });
  } catch (err) {
    console.error("[activate-role]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error activating role." },
      { status: 500 }
    );
  }
}
