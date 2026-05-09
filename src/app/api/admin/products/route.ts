import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        seller: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching products." },
      { status: 500 }
    );
  }
}
