import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdminOrServiceKey } from "../../../../../lib/auth-helpers";

export async function GET(req: Request) {
  try {
    await requireAdminOrServiceKey(req);

    const checks: Record<string, { status: string; error?: string }> = {};

    // Database (Neon via Prisma)
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = { status: "ok" };
    } catch (e) {
      checks.database = { status: "error", error: String(e) };
    }

    // Clerk
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      await client.users.getUserList({ limit: 1 });
      checks.clerk = { status: "ok" };
    } catch (e) {
      checks.clerk = { status: "error", error: String(e) };
    }

    // Resend (check API key configured)
    checks.resend = process.env.RESEND_KEY
      ? { status: "ok" }
      : { status: "not configured" };

    // Gemini (check API key configured)
    checks.gemini = process.env.GEMINI_API_KEY
      ? { status: "ok" }
      : { status: "not configured" };

    // Cloudinary (check API key configured)
    checks.cloudinary = process.env.CLOUDINARY_CLOUD_NAME
      ? { status: "ok" }
      : { status: "not configured" };

    const allOk = Object.values(checks).every((c) => c.status === "ok");

    return NextResponse.json({
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      dependencies: checks,
    });
  } catch (error: any) {
    console.error("[admin/health/dependencies]", error);
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ausente o inválido." }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "FORBIDDEN", message: "Requiere rol de administrador." }, { status: 403 });
    }
    return NextResponse.json({ error: "SERVER_ERROR", message: "Error interno del servidor." }, { status: 500 });
  }
}
