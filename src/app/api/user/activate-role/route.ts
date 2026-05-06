import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token ausente o inválido." },
        { status: 401 }
      );
    }

    const { role } = await req.json();
    if (!role) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "El rol es obligatorio." },
        { status: 400 }
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

    return NextResponse.json({ success: true, roles: [...currentRoles, role] });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error al actualizar el rol." },
      { status: 500 }
    );
  }
}
