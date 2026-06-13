import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../../lib/auth-helpers";

export async function POST(
  _req: Request,
  context: { params: Promise<{ clerkId: string }> }
) {
  try {
    await requireAdminOrServiceKey(_req);

    const { clerkId } = await context.params;

    const seller = await prisma.sellerProfile.findUnique({ where: { clerkId } });
    if (!seller) {
      return NextResponse.json({ error: "SELLER_NOT_FOUND", message: "Seller not found." }, { status: 404 });
    }

    if (seller.suspended) {
      return NextResponse.json({ error: "ALREADY_DISABLED", message: "Seller is already disabled." }, { status: 409 });
    }

    await prisma.sellerProfile.update({
      where: { clerkId },
      data: { suspended: true },
    });

    return NextResponse.json({ success: true, clerkId, action: "disabled" });
  } catch (error: any) {
    console.error("[admin/users/disable]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
