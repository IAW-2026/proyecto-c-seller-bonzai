import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import * as productRepo from "../../../../../repositories/productRepository";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params;
    const identifier = slug[slug.length - 1];

    const isSlug = identifier.includes("-") && identifier.length > 20;
    const product = isSlug
      ? await productRepo.findProductBySlug(identifier)
      : await prisma.product.findUnique({
          where: { id: identifier },
          include: { category: true, seller: { select: { id: true, email: true, approved: true, suspended: true } } },
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
    console.error("[products/browse/[...slug]]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
