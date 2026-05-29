import { NextResponse } from "next/server";
import { deleteReview } from "../../../../services/reviewService";
import { requireAdmin } from "../../../../lib/auth-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (err: any) {
    console.error("[reviews DELETE auth]", err);
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await deleteReview(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reviews DELETE]", err);
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
