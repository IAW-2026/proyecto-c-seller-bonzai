import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[categories]", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching categories." },
      { status: 500 }
    );
  }
}
