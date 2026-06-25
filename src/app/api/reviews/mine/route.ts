import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSellerId } from "../../../../lib/auth-helpers";

export async function GET() {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch (err) {
    console.error("[reviews mine auth]", err);
    return NextResponse.json({ review: null });
  }

  try {
    const review = await prisma.sellerReview.findUnique({
      where: { sellerId },
    });
    return NextResponse.json({ review });
  } catch (err) {
    console.error("[reviews mine query]", err);
    return NextResponse.json({ review: null });
  }
}
