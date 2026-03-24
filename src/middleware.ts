import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = !!token;

  // Protect /dashboard/* and /onboarding — require auth
  if (!isAuthenticated) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user hitting /dashboard — check onboarding
  if (pathname.startsWith("/dashboard")) {
    const onboardingComplete = (token as any)?.onboardingComplete ?? false;
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Authenticated user hitting /onboarding who already completed it
  if (pathname === "/onboarding") {
    const onboardingComplete = (token as any)?.onboardingComplete ?? false;
    if (onboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
