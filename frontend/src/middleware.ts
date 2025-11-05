import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware for route protection
 * Checks authentication status for protected routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path starts with /dashboard
  if (pathname.startsWith('/dashboard')) {
    // Get the token from localStorage via headers (this won't work in middleware)
    // For now, we'll let the client-side handle the auth check
    // The middleware will only check for the presence of a token in cookies
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      // Only redirect if we're sure there's no token
      // In development, we'll be more permissive
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*'
  ]
};
