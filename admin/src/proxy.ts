import { NextResponse, type NextRequest } from 'next/server';

const ACCESS_COOKIE = 'admin_access_token';
const PUBLIC_PATHS = ['/login'];

/**
 * Fast, optimistic UX gate only — it just checks whether the access-token
 * cookie is present, not whether it's still valid. Real authorization is
 * always re-checked server-side on every API call (ARCHITECTURE.md §37);
 * this only prevents a flash of protected content / an unnecessary trip to
 * a page that will immediately bounce the user back to /login.
 */
export function proxy(request: NextRequest) {
  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
  const hasSessionCookie = request.cookies.has(ACCESS_COOKIE);

  if (!isPublicPath && !hasSessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicPath && hasSessionCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
