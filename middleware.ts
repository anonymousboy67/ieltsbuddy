import { auth } from "@/auth";

const STATIC_ADMIN_EMAIL = "admin@iletsbuddy.com";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin');
  const role = (req.auth?.user as { role?: string } | undefined)?.role;
  const email = (req.auth?.user as { email?: string } | undefined)?.email;
  const isHome = pathname === '/';

  // Any direct URL (except home) should require authentication.
  if (!isLoggedIn && !isHome) {
    return Response.redirect(new URL('/?auth=login', req.nextUrl));
  }

  // Admin users should only use admin routes.
  if (isLoggedIn && role === 'admin' && email === STATIC_ADMIN_EMAIL && !isOnAdmin) {
    return Response.redirect(new URL('/admin', req.nextUrl));
  }

  // Non-admin authenticated users cannot access admin routes.
  if (isLoggedIn && (role !== 'admin' || email !== STATIC_ADMIN_EMAIL) && isOnAdmin) {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }

  // If they try to access the dashboard without logging in, kick them out
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }

  // Admin panel is restricted to logged-in admins only.
  if (isOnAdmin && (!isLoggedIn || role !== 'admin' || email !== STATIC_ADMIN_EMAIL)) {
    return Response.redirect(new URL('/?auth=login', req.nextUrl));
  }

  // If they're already logged in and hit the homepage, send them to the dashboard
  if (req.nextUrl.pathname === "/" && isLoggedIn) {
    return Response.redirect(new URL(role === 'admin' ? '/admin' : '/dashboard', req.nextUrl));
  }
});

// Tell Next.js which routes to run the bouncer on (skip static files & API routes)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
