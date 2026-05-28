import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSellerId } from "../../../../lib/auth-helpers";

export async function GET() {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ review: null });
  }

  try {
    const review = await prisma.sellerReview.findFirst({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ review });
  } catch {
    return NextResponse.json({ review: null });
  }
}
