import { NextResponse } from "next/server";
import { getAllReviews, createReview } from "../../../services/reviewService";
import { createReviewSchema } from "../../../validators/review";
import { getSellerId } from "../../../lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const result = await getAllReviews(page, limit);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let sellerId: string;
  try {
    sellerId = await getSellerId();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, { status: 400 });
    }

    const review = await createReview(sellerId, parsed.data);
    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
