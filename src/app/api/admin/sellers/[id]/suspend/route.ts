import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const seller = await prisma.sellerProfile.findUnique({ where: { clerkId: id } });

    if (!seller) {
      return NextResponse.json(
        { error: "SELLER_NOT_FOUND", message: "El vendedor no existe." },
        { status: 404 }
      );
    }

    if (seller.suspended) {
      return NextResponse.json(
        { error: "SELLER_ALREADY_SUSPENDED", message: "El vendedor ya está suspendido." },
        { status: 409 }
      );
    }

    await prisma.sellerProfile.update({
      where: { clerkId: id },
      data: { suspended: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
