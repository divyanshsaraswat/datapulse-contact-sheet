import { getServerSession } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from './mongodb';
import User from '@/models/User';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'MISSING_GOOGLE_CLIENT_ID',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'MISSING_GOOGLE_CLIENT_SECRET',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === 'google') {
        try {
          await connectDB();
          await User.findOneAndUpdate(
            { googleId: account.providerAccountId },
            {
              googleId: account.providerAccountId,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
          );
        } catch (err) {
          console.error('Error syncing user to DB:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.googleId = token.googleId;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev_secret_fallback_1234567890',
};

export async function getServerSessionSafe() {
  try {
    return await getServerSession(authOptions);
  } catch (err) {
    console.error('⚠️ NextAuth session decryption or validation failed:', err.message);
    return null;
  }
}
