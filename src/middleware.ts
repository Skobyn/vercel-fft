import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  const protectedRoutes = [
    '/dashboard',
    '/transactions',
    '/budgets',
    '/bills',
    '/goals',
    '/reports',
    '/profile',
    '/settings',
    '/connect-bank',
  ];

  const matchesProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Public routes (no auth required)
  if (!matchesProtectedRoute) {
    return NextResponse.next();
  }

  // Check if the user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || "demo-secret-key-change-in-production",
  });

  // If the user is not authenticated and trying to access a protected route,
  // redirect to the login page
  if (!token && matchesProtectedRoute) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  // If the user is authenticated, allow access to protected routes
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
