import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;
  
  // 1. WWW redirect to root domain
  if (hostname === 'www.cometbpo.org') {
    return NextResponse.redirect(new URL(`https://cometbpo.org${pathname}${url.search}`, req.url), 301);
  }

  // 2. Whitelist auth routes and static assets
  if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/logout') {
    return NextResponse.next();
  }

  // Define the domains
  const chatDomain = 'chat.cometbpo.org';
  const mainDomain = 'cometbpo.org';

  // --- SUBDOMAIN LOGIC ---
  if (hostname === chatDomain) {
    // 1. If not authenticated
    if (!token) {
      // Allow access to the chat-login page only
      if (pathname === '/chat-login') {
        return NextResponse.next();
      }
      // Redirect everything else to chat-login
      return NextResponse.redirect(new URL('/chat-login', req.url));
    }

    // 2. If authenticated
    // If they try to go to /chat-login while logged in, send them to the hub
    if (pathname === '/chat-login') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Rewrite root to /chat
    if (pathname === '/') {
      url.pathname = '/chat';
      return NextResponse.rewrite(url);
    }

    // RESTRICTION: Only allow communication-related paths on this subdomain
    const allowedPaths = ['/chat', '/chatroom', '/chatroom-login', '/chatrooms', '/management-chat', '/chat-login', '/api', '/_next', '/favicon.ico'];
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowed) {
      return NextResponse.redirect(new URL('https://' + mainDomain + pathname, req.url));
    }
    
    return NextResponse.next();
  }

  // --- MAIN DOMAIN LOGIC ---
  const isAuthPage = pathname === '/';
  
  // If authenticated and on login page, send to dashboard
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If not authenticated and not on login page, send to login
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Handle Main Domain Redirects (Redirect /chat to subdomain in production)
  if (!hostname.includes('localhost') && !hostname.includes('vercel.app')) {
    if (pathname.startsWith('/chat')) {
      return NextResponse.redirect(new URL('https://' + chatDomain + pathname, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
