import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

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
          const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
          }).lean();

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            (user as any).password
          );

          if (!isPasswordValid) {
            return null;
          }

          const u: any = user;
          return {
            id: u._id?.toString?.() || '',
            email: u.email,
            username: u.username,
            name: u.name,
            role: u.role,
            permissions: u.permissions || {},
          };
        } catch (error) {
          console.error('Auth error:', error);
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
  secret: process.env.NEXTAUTH_SECRET || 'temp-build-secret-replace-in-production',
};

// Validate NEXTAUTH_SECRET at runtime
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  console.error('⚠️  WARNING: NEXTAUTH_SECRET is missing in production!');
  console.error('⚠️  Please set NEXTAUTH_SECRET in your Vercel environment variables.');
  console.error('⚠️  Generate one at: https://generate-secret.vercel.app/32');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

