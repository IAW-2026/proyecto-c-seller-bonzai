import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ── CORS ──────────────────────────────────────────────────────────────────────

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (["http://localhost:3000", "http://localhost:3001"].includes(origin))
    return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function addCorsHeaders(res: NextResponse, origin: string | null): void {
  if (!origin) return;
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-service-key");
  res.headers.set("Access-Control-Max-Age", "86400");
}

// ── Auth routes ───────────────────────────────────────────────────────────────

const publicRoutes = ["/", "/api/health", "/api/auth/check-email", "/api/user/activate-role", "/api/products/browse", "/api/sellers", "/sign-in", "/sign-up", "/webhooks", "/activate-seller"];

async function getUserRoles(userId: string): Promise<string[]> {
  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const rawRoles = (user.publicMetadata as any)?.roles;
  return Array.isArray(rawRoles)
    ? rawRoles
    : rawRoles && typeof rawRoles === "object"
      ? Object.values(rawRoles)
      : [];
}

export default clerkMiddleware(async (auth, req) => {
  const origin = req.headers.get("origin");
  const allowed = isOriginAllowed(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    if (!allowed) return NextResponse.next();
    const res = new NextResponse(null, { status: 204 });
    addCorsHeaders(res, origin);
    return res;
  }

  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  if (pathname === "/activate-seller" && userId) {
    const roles = await getUserRoles(userId);
    if (roles.includes("seller"))
      return NextResponse.redirect(new URL("/dashboard", req.url));
    const res = NextResponse.next();
    addCorsHeaders(res, origin);
    return res;
  }

  if (pathname.startsWith("/activate-seller")) {
    const res = NextResponse.next();
    addCorsHeaders(res, origin);
    return res;
  }

  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    const res = NextResponse.next();
    addCorsHeaders(res, origin);
    return res;
  }

  const serviceKey = req.headers.get("x-service-key");
  if (serviceKey === process.env.SERVICE_API_KEY) {
    const res = NextResponse.next();
    addCorsHeaders(res, origin);
    return res;
  }

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token ausente o inválido." },
        { status: 401 }
      );
      addCorsHeaders(res, origin);
      return res;
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles = await getUserRoles(userId);

  if (pathname.startsWith("/dashboard")) {
    if (!roles.includes("seller"))
      return NextResponse.redirect(new URL("/activate-seller", req.url));
    const res = NextResponse.next();
    addCorsHeaders(res, origin);
    return res;
  }

  if (pathname.startsWith("/api/admin/")) {
    if (!roles.includes("seller_admin") && !roles.includes("super_admin")) {
      const res = NextResponse.json(
        { error: "FORBIDDEN", message: "Requiere rol de administrador." },
        { status: 403 }
      );
      addCorsHeaders(res, origin);
      return res;
    }
  } else if (pathname.startsWith("/api/")) {
    if (!roles.includes("seller") && !roles.includes("seller_admin") && !roles.includes("super_admin")) {
      const res = NextResponse.json(
        { error: "FORBIDDEN", message: "Requiere rol de vendedor." },
        { status: 403 }
      );
      addCorsHeaders(res, origin);
      return res;
    }
  }

  const res = NextResponse.next();
  addCorsHeaders(res, origin);
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
