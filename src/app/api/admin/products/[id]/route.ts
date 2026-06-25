import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin, requireAdminOrServiceKey } from "../../../../../lib/auth-helpers";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrServiceKey(req);

    const { id } = await context.params;
    const body = await req.json();

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "El producto no existe." },
        { status: 404 }
      );
    }

    if (typeof body.suspended === "boolean") {
      await prisma.product.update({
        where: { id },
        data: { suspended: body.suspended },
      });
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: { seller: true, category: true },
    });

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error("[admin/products PATCH]", error);
    if (error.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    if (error.message === "FORBIDDEN")
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "El producto no existe." },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: "PRODUCT_ALREADY_DEACTIVATED", message: "El producto ya fue dado de baja." },
        { status: 409 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/products DELETE]", error);
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
