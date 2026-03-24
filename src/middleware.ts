import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user;

  // Protect /dashboard/* and /onboarding — require auth
  const isProtected =
    pathname.startsWith("/dashboard") || pathname === "/onboarding";

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user hitting /dashboard — check onboarding
  if (pathname.startsWith("/dashboard") && isAuthenticated) {
    const onboardingComplete = (req.auth as any)?.onboardingComplete ?? false;
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Authenticated user hitting /onboarding who already completed it — go to dashboard
  if (pathname === "/onboarding" && isAuthenticated) {
    const onboardingComplete = (req.auth as any)?.onboardingComplete ?? false;
    if (onboardingComplete) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
