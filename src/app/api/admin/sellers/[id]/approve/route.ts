import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAdmin } from "../../../../../../lib/auth-helpers";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const seller = await prisma.sellerProfile.findUnique({ where: { clerkId: id } });

    if (!seller) {
      return NextResponse.json(
        { error: "SELLER_NOT_FOUND", message: "El vendedor no existe." },
        { status: 404 }
      );
    }

    if (seller.approved) {
      return NextResponse.json(
        { error: "SELLER_ALREADY_APPROVED", message: "El vendedor ya fue aprobado." },
        { status: 409 }
      );
    }

    await prisma.sellerProfile.update({
      where: { clerkId: id },
      data: { approved: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/sellers/approve]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
