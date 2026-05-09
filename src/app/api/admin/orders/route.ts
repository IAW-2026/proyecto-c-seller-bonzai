import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + o.total, 0);

    return NextResponse.json({ orders, totalRevenue });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Error fetching orders." },
      { status: 500 }
    );
  }
}
