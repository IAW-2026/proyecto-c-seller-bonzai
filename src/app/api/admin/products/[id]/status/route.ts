import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status, note } = await req.json();

    const validStatuses = ["REMOVED_INAPPROPRIATE", "REMOVED_COUNTERFEIT", "REMOVED_OTHER"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "INVALID_STATUS", message: `Status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "Product not found." },
        { status: 404 }
      );
    }

    if (product.moderationStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "ALREADY_MODERATED", message: "Product has already been moderated." },
        { status: 409 }
      );
    }

    await prisma.product.update({
      where: { id },
      data: {
        moderationStatus: status,
        moderationNote: note || null,
        isActive: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error updating product status." },
      { status: 500 }
    );
  }
}
