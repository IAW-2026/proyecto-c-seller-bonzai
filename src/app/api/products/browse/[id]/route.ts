import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: { id: true, email: true, approved: true, suspended: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "PRODUCT_NOT_FOUND", message: "Product not found." }, { status: 404 });
    }

    if (!product.isActive || product.suspended || product.moderationStatus !== "ACTIVE") {
      return NextResponse.json({ error: "PRODUCT_NOT_AVAILABLE", message: "Product is not available." }, { status: 404 });
    }

    if (!product.seller.approved || product.seller.suspended) {
      return NextResponse.json({ error: "SELLER_NOT_AVAILABLE", message: "Seller is not available." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("[products/browse/[id]]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
