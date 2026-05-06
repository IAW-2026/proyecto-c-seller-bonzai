import { NextResponse } from "next/server";
import { createProductSchema } from "../../../validators";
import * as productService from "../../../services/productService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const product = await productService.createProduct(parsed.data);

    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "sellerId es requerido." },
        { status: 400 }
      );
    }

    const products = await productService.getProductsBySeller(sellerId);

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
