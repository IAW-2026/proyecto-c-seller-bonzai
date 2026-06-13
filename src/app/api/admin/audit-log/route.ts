import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrServiceKey } from "../../../../lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrServiceKey(req);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    return NextResponse.json({
      message: "Audit log requires a persistent event store to track admin actions. Currently not implemented.",
      note: "Admin actions are logged via console.error and can be viewed in Vercel Function logs.",
      page,
      limit,
      entries: [],
      total: 0,
    });
  } catch (error: any) {
    console.error("[admin/audit-log]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
