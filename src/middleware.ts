import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to handle auth redirects
export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const isPublicPath = path.startsWith('/auth/') || 
                      path === '/' || 
                      path.startsWith('/api/');

  // Get the token from the session cookie
  const token = request.cookies.get('session')?.value;

  // Redirect unauthenticated users to signin page
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && path.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configure paths that should be protected
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
