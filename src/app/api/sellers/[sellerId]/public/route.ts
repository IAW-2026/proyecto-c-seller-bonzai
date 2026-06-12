import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await context.params;

    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        email: true,
        approved: true,
        suspended: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "SELLER_NOT_FOUND", message: "Seller not found." }, { status: 404 });
    }

    if (!profile.approved || profile.suspended) {
      return NextResponse.json({ error: "SELLER_NOT_AVAILABLE", message: "Seller is not available." }, { status: 404 });
    }

    const review = await prisma.sellerReview.findUnique({
      where: { sellerId },
      select: { rating: true, comment: true, createdAt: true },
    });

    return NextResponse.json({
      seller: {
        id: profile.id,
        email: profile.email,
        createdAt: profile.createdAt.toISOString(),
      },
      review: review || null,
    });
  } catch (err) {
    console.error("[sellers/public]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
