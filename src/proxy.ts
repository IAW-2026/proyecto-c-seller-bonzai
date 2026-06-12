import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  const { userId } = await auth();
  const pathname = req.nextUrl.pathname;

  if (pathname === "/activate-seller" && userId) {
    const roles = await getUserRoles(userId);
    if (roles.includes("seller")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/activate-seller")) {
    return NextResponse.next();
  }

  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const serviceKey = req.headers.get("x-service-key");
  if (serviceKey === process.env.SERVICE_API_KEY) {
    return NextResponse.next();
  }

  if (!userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Token ausente o inválido." },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const roles = await getUserRoles(userId);

  if (pathname.startsWith("/dashboard")) {
    if (!roles.includes("seller")) {
      return NextResponse.redirect(new URL("/activate-seller", req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    if (!roles.includes("seller_admin") && !roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Requiere rol de administrador." },
        { status: 403 }
      );
    }
  } else if (pathname.startsWith("/api/")) {
    if (!roles.includes("seller") && !roles.includes("seller_admin") && !roles.includes("super_admin")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Requiere rol de vendedor." },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
