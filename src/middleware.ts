import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/landing', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  
  // Subdomain routing for admin
  if (subdomain === 'adminls' || subdomain === 'admin' || subdomain === 'lsadmin') {
    // If pathname already starts with /admin, serve as-is without any rewrites
    if (pathname.startsWith('/admin')) {
      return NextResponse.next();
    }
    // Admin subdomain - serve admin dashboard
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    // Rewrite /login to /admin/login
    if (pathname === '/login') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }
    // Keep /dashboard as /admin/dashboard
    if (pathname === '/dashboard') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    // For other paths, add /admin prefix
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }
  
  // Main domain - no automatic rewrite, let routes handle themselves
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
