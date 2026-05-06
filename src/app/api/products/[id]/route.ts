import { NextResponse } from "next/server";
import { updateProductSchema } from "../../../../validators";
import * as productService from "../../../../services/productService";
import { verifyProductOwnership } from "../../../../lib/auth-helpers";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await verifyProductOwnership(id);

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
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token ausente o inválido." },
        { status: 401 }
      );
    }
    if (error.message === "SELLER_NOT_FOUND") {
      return NextResponse.json(
        { error: "SELLER_NOT_FOUND", message: "No existe un perfil de vendedor para esta cuenta." },
        { status: 404 }
      );
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "El producto no existe." },
        { status: 404 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "No tenés permisos sobre este producto." },
        { status: 403 }
      );
    }
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

    await verifyProductOwnership(id);

    const result = await productService.deleteProduct(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token ausente o inválido." },
        { status: 401 }
      );
    }
    if (error.message === "SELLER_NOT_FOUND") {
      return NextResponse.json(
        { error: "SELLER_NOT_FOUND", message: "No existe un perfil de vendedor para esta cuenta." },
        { status: 404 }
      );
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return NextResponse.json(
        { error: "PRODUCT_NOT_FOUND", message: "El producto no existe." },
        { status: 404 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "No tenés permisos sobre este producto." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
