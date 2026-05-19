import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const isProd = process.env.NODE_ENV === 'production';
const cookiePrefix = isProd ? '__Secure-' : '';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();
          const identifier = credentials.identifier.toLowerCase().trim();
          console.log('[auth] Login attempt for:', identifier);

          const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          }).lean();

          if (!user) {
            console.log('[auth] User not found:', identifier);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            (user as any).password
          );

          if (!isPasswordValid) {
            console.log('[auth] Invalid password for:', identifier);
            return null;
          }

          console.log('[auth] Login success for:', identifier);
          const u: any = user;
          return {
            id: u._id?.toString?.() || '',
            email: u.email,
            username: u.username,
            name: u.name,
            role: u.role,
            permissions: u.permissions || {},
          };
        } catch (error: any) {
          console.error('[auth] CRITICAL error:', error.message, error.stack);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = (user as any).permissions || {};
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'Admin' | 'Supervisor' | 'User';
        session.user.permissions = (token as any).permissions as any;
        session.user.username = (token as any).username as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
        domain: isProd ? '.cometbpo.org' : undefined,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: isProd,
        domain: isProd ? '.cometbpo.org' : undefined,
      },
    },
    csrfToken: {
      name: `${isProd ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProd,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'temp-build-secret-replace-in-production',
};

// Validate NEXTAUTH_SECRET at runtime
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  console.error('⚠️  WARNING: NEXTAUTH_SECRET is missing in production!');
  console.error('⚠️  Please set NEXTAUTH_SECRET in your Vercel environment variables.');
  console.error('⚠️  Generate one at: https://generate-secret.vercel.app/32');
}

const handler = NextAuth(authOptions);

// Intercept signout to clear legacy/duplicate cookies
async function handleSignoutCookies(req: Request, res: Response): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname.endsWith('/signout')) {
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
    ];

    const domains = [
      '', // Host-only cookie (no domain attribute)
      '.cometbpo.org',
      'cometbpo.org',
      'www.cometbpo.org',
      'chat.cometbpo.org',
    ];

    cookieNames.forEach((name) => {
      domains.forEach((domain) => {
        let cookieString = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`;
        if (domain) {
          cookieString += `; Domain=${domain}`;
        }
        if (name.startsWith('__Secure-') || name.startsWith('__Host-')) {
          cookieString += '; Secure';
        }
        res.headers.append('Set-Cookie', cookieString);
      });
    });
  }
  return res;
}

export async function GET(req: Request, ctx: any) {
  const res = await handler(req, ctx);
  return handleSignoutCookies(req, res);
}

export async function POST(req: Request, ctx: any) {
  const res = await handler(req, ctx);
  return handleSignoutCookies(req, res);
}

