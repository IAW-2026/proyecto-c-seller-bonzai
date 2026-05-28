import { NextResponse } from "next/server";
import { deleteReview } from "../../../../services/reviewService";
import { requireAdmin } from "../../../../lib/auth-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteReview(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
