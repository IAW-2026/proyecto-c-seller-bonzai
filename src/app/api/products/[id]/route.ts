import { NextResponse } from "next/server";
import { updateProductSchema } from "../../../../validators";
import * as productService from "../../../../services/productService";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Datos de actualización inválidos." },
        { status: 400 }
      );
    }

    const result = await productService.updateProduct(id, parsed.data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(result.product);
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const result = await productService.deleteProduct(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
