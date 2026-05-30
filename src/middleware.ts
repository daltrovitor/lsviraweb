import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/landing', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  console.log('[Middleware] Pathname:', pathname, 'Hostname:', hostname);
  
  // Extract subdomain
  const subdomain = hostname.split('.')[0];
  console.log('[Middleware] Subdomain:', subdomain);
  
  // Subdomain routing for admin
  if (subdomain === 'adminls' || subdomain === 'admin' || subdomain === 'lsadmin') {
    console.log('[Middleware] Admin subdomain detected');
    // If pathname already starts with /admin, serve as-is without any rewrites
    if (pathname.startsWith('/admin')) {
      console.log('[Middleware] Path already starts with /admin, passing through');
      return NextResponse.next();
    }
    // Admin subdomain - serve admin dashboard
    if (pathname === '/') {
      console.log('[Middleware] Rewriting / to /admin/dashboard');
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    // Rewrite /login to /admin/login
    if (pathname === '/login') {
      console.log('[Middleware] Rewriting /login to /admin/login');
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.rewrite(url);
    }
    // Keep /dashboard as /admin/dashboard
    if (pathname === '/dashboard') {
      console.log('[Middleware] Rewriting /dashboard to /admin/dashboard');
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    // For other paths, add /admin prefix
    console.log('[Middleware] Adding /admin prefix to:', pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }
  
  console.log('[Middleware] Not admin subdomain, passing through');
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
