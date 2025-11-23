import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/about',
    '/contact',
    '/services',
    '/onlineappointment',
  ];
  
  // Define admin/protected paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/appointments',
    '/patients',
    '/inquiries',
    '/logs',
    '/reports',
    '/settings',
  ];
  
  // Check if path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(publicPath + '/')
  );
  
  // Check if path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path === protectedPath || path.startsWith(protectedPath + '/')
  );
  
  // Get the token and adminData from cookies (actual cookie names used in the app)
  const token = request.cookies.get('accessToken')?.value || '';
  const adminData = request.cookies.get('adminData')?.value || '';
  
  // If user is logged in and tries to access login page, redirect to dashboard
  if (path === '/login' && token && adminData) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is not logged in and tries to access protected route, redirect to login
  if (isProtectedPath && (!token || !adminData)) {
    const loginUrl = new URL('/login', request.url);
    // Add a return URL so we can redirect back after login if needed
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Apply to all routes except api, _next, static, and public files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|sw.js).*)',
  ],
}; 