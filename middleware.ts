import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup'];

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.includes(path);

  // Get the user token from cookies
  const userToken = request.cookies.get('user')?.value;

  // If the path is public and user is logged in, redirect to dashboard
  if (isPublicRoute && userToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the path is not public and user is not logged in, redirect to login
  if (!isPublicRoute && !userToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 