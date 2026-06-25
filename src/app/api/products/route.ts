import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createProductSchema } from "../../../validators";
import * as productService from "../../../services/productService";
import { getSellerId } from "../../../lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const sellerId = await getSellerId();

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const product = await productService.createProduct({
      ...parsed.data,
      sellerId,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("[products POST]", error);
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
    if (error.message === "SELLER_SUSPENDED") {
      return NextResponse.json(
        { error: "SELLER_SUSPENDED", message: "Tu cuenta de vendedor está suspendida." },
        { status: 403 }
      );
    }
    if (error.message === "SELLER_NOT_APPROVED") {
      return NextResponse.json(
        { error: "SELLER_NOT_APPROVED", message: "Tu cuenta de vendedor aún no ha sido aprobada." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sellerId = await getSellerId();

    const products = await productService.getProductsBySeller(sellerId);

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("[products GET]", error);
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
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
