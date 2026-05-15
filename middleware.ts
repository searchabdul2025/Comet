import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const url = req.nextUrl.clone();
    const hostname = req.headers.get('host') || '';
    
    // Define the chat subdomain
    const chatDomain = 'chat.cometbpo.org';
    const mainDomain = 'cometbpo.org';

    // Handle Subdomain Routing
    if (hostname === chatDomain) {
      // If not authenticated on subdomain, redirect to main login
      if (!token) {
        return NextResponse.redirect(new URL('https://' + mainDomain, req.url));
      }

      // 1. If at root of subdomain, rewrite to /chat
      if (url.pathname === '/') {
        url.pathname = '/chat';
        return NextResponse.rewrite(url);
      }

      // 2. RESTRICTION: Only allow communication-related paths on this subdomain
      const allowedPaths = ['/chat', '/chatroom', '/chatroom-login', '/chatrooms', '/management-chat', '/api', '/_next', '/favicon.ico'];
      const isAllowed = allowedPaths.some(path => url.pathname.startsWith(path));

      if (!isAllowed) {
        // If they try to access /dashboard, /settings, etc. on the chat subdomain,
        // redirect them back to the main portal
        return NextResponse.redirect(new URL('https://' + mainDomain + url.pathname, req.url));
      }
      
      return NextResponse.next();
    }

    // Handle Main Domain Redirects (Optional: Redirect /chat to subdomain)
    if (hostname === mainDomain || hostname.includes('localhost') || hostname.includes('vercel.app')) {
      if (url.pathname.startsWith('/chat')) {
         // Only redirect in production to avoid local dev issues
         if (!hostname.includes('localhost')) {
           return NextResponse.redirect(new URL('https://' + chatDomain + url.pathname, req.url));
         }
      }
    }

    const isAuthPage = req.nextUrl.pathname === '/';

    // Allow access to login page on main domain
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated on main domain
    if (!token && !isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const hostname = req.headers.get('host') || '';
        // Always allow the main login page
        if (req.nextUrl.pathname === '/' && !hostname.startsWith('chat.')) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

