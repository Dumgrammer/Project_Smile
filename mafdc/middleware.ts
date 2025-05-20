import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/register' || path === '/forgot-password';
  
  // Get the token from cookies
  const token = request.cookies.get('auth-token')?.value || '';
  
  // Redirect logic
  if (isPublicPath && token) {
    // If user is logged in and tries to access login page, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  if (!isPublicPath && !token) {
    // If user is not logged in and tries to access protected route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Apply to all routes except api, _next, static, and public files
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 