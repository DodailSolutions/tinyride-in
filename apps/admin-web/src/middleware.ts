import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ParsedToken {
  role?: string;
  exp?: number;
  [key: string]: any;
}

function parseTokenPayload(token: string | undefined): ParsedToken | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0]) return null;
  const dataB64 = parts[0];
  try {
    const jsonStr = atob(dataB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, APIs, and public landings
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read session cookies
  const adminToken = request.cookies.get('tinyride_admin_session')?.value;
  const driverToken = request.cookies.get('tinyride_driver_session')?.value;
  const parentToken = request.cookies.get('tinyride_session')?.value;
  const schoolToken = request.cookies.get('tinyride_school_session')?.value;

  const adminPayload = parseTokenPayload(adminToken);
  const driverPayload = parseTokenPayload(driverToken);
  const parentPayload = parseTokenPayload(parentToken);
  const schoolPayload = parseTokenPayload(schoolToken);

  const isAdmin = adminPayload?.role === 'admin';
  const isDriver = driverPayload?.role === 'driver';
  const isParent = parentPayload?.role === 'parent';
  const isSchool = schoolPayload?.role === 'school';

  // ─────────────────────────────────────────────────────────────
  // A. ADMIN ROUTES (/admin/*)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    if (isAdmin) {
      return NextResponse.next();
    }

    // Role-based redirects if wrong persona attempts to enter admin
    if (isDriver) {
      return NextResponse.redirect(new URL('/driver', request.url));
    }
    if (isParent) {
      return NextResponse.redirect(new URL('/parent', request.url));
    }
    if (isSchool) {
      return NextResponse.redirect(new URL('/school', request.url));
    }

    // Unauthenticated: redirect to /admin/login
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─────────────────────────────────────────────────────────────
  // B. DRIVER APP ROUTES (/driver/*, excluding public /drivers)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/driver')) {
    const isPublicDriverRoute =
      pathname === '/driver/login' || pathname.startsWith('/driver/login');

    if (isPublicDriverRoute) {
      if (isDriver) {
        return NextResponse.redirect(new URL('/driver', request.url));
      }
      return NextResponse.next();
    }

    // Prevent cross-role leakage
    if (isParent) {
      return NextResponse.redirect(new URL('/parent', request.url));
    }
    if (isSchool) {
      return NextResponse.redirect(new URL('/school', request.url));
    }

    if (!isDriver) {
      return NextResponse.redirect(new URL('/driver/login', request.url));
    }

    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────
  // C. PARENT APP ROUTES (/parent/*, excluding public /parents)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/parent')) {
    const isPublicParentRoute =
      pathname === '/parent/login' ||
      pathname === '/parent/verify' ||
      pathname.startsWith('/parent/login') ||
      pathname.startsWith('/parent/verify');

    if (isPublicParentRoute) {
      if (isParent) {
        return NextResponse.redirect(new URL('/parent', request.url));
      }
      return NextResponse.next();
    }

    // Prevent cross-role leakage
    if (isDriver) {
      return NextResponse.redirect(new URL('/driver', request.url));
    }
    if (isSchool) {
      return NextResponse.redirect(new URL('/school', request.url));
    }

    if (!isParent) {
      return NextResponse.redirect(new URL('/parent/login', request.url));
    }

    return NextResponse.next();
  }

  // ─────────────────────────────────────────────────────────────
  // D. SCHOOL APP ROUTES (/school/*, excluding public /schools)
  // ─────────────────────────────────────────────────────────────
  if (pathname.startsWith('/school')) {
    const isPublicSchoolRoute =
      pathname === '/school/login' ||
      pathname === '/school/signup' ||
      pathname.startsWith('/school/login') ||
      pathname.startsWith('/school/signup');

    if (isPublicSchoolRoute) {
      if (isSchool) {
        return NextResponse.redirect(new URL('/school', request.url));
      }
      return NextResponse.next();
    }

    // Prevent cross-role leakage
    if (isParent) {
      return NextResponse.redirect(new URL('/parent', request.url));
    }
    if (isDriver) {
      return NextResponse.redirect(new URL('/driver', request.url));
    }

    if (!isSchool) {
      return NextResponse.redirect(new URL('/school/login', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/driver/:path*',
    '/parent/:path*',
    '/school/:path*',
  ],
};
