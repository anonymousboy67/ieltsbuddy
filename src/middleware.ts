import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const isSecure = process.env.NODE_ENV === "production";
const cookieName = isSecure
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    secureCookie: isSecure,
  });
  const isAuthenticated = !!token;

  // Not signed in — redirect to sign-in
  if (!isAuthenticated) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Signed in but hasn't completed onboarding — redirect to /onboarding
  if (pathname.startsWith("/dashboard")) {
    const onboardingComplete = (token as Record<string, unknown>).onboardingComplete ?? false;
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Already completed onboarding — skip /onboarding, go to dashboard
  if (pathname === "/onboarding") {
    const onboardingComplete = (token as Record<string, unknown>).onboardingComplete ?? false;
    if (onboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
