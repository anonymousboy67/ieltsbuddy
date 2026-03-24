import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectUsersDb } from '@/lib/mongodb-connections';
import User from '@/models/User';

const STATIC_ADMIN_EMAIL = 'admin@iletsbuddy.com';
const STATIC_ADMIN_PASSWORD = 'admin';
const STATIC_ADMIN_USERNAME = 'admin';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,

  providers: [
    Google({
      clientId: process.env.WEB_CLIENT_ID || process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        isOtpLogin: { label: "Is OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email) throw new Error("Email is required");

        const identifier = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password || '');

        // Fixed admin account shortcut (works even without MongoDB user record).
        if (
          (identifier === STATIC_ADMIN_EMAIL || identifier === STATIC_ADMIN_USERNAME) &&
          password === STATIC_ADMIN_PASSWORD
        ) {
          return {
            id: 'static-admin',
            email: STATIC_ADMIN_EMAIL,
            name: 'Admin',
            role: 'admin',
          };
        }

        await connectUsersDb();

        let loginEmail = identifier;
        if (!loginEmail.includes('@')) {
          const byUsername = await User.findOne({ username: loginEmail });
          if (!byUsername?.email) {
            throw new Error('No account found with that username. Please sign up first.');
          }
          loginEmail = byUsername.email.toLowerCase();
        }

        let user = await User.findOne({ email: loginEmail.toLowerCase() });

        // CASE 1: OTP Login (triggered after /api/auth/verify-otp succeeds)
        if (credentials.isOtpLogin === "true") {
          if (!user) throw new Error("User not found. Please sign up first.");
          if (user.isDisabled) throw new Error("Your account has been disabled. Contact admin.");
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || user.username,
            role: user.role,
          };
        }

        // CASE 2: Normal Password Login via Firebase Auth (Mongo is profile vault only).
        if (!credentials.password) throw new Error('Password is required.');
        if (!FIREBASE_API_KEY) throw new Error('Firebase API key is missing in environment.');

        const firebaseRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: loginEmail,
              password,
              returnSecureToken: true,
            }),
          }
        );

        if (!firebaseRes.ok) {
          throw new Error('Invalid password. Please try again.');
        }

        const firebaseData = (await firebaseRes.json()) as {
          localId?: string;
          email?: string;
          displayName?: string;
        };

        if (!user) {
          const baseUsername = (firebaseData.email || loginEmail).split('@')[0].toLowerCase();
          let finalUsername = baseUsername;
          const taken = await User.findOne({ username: finalUsername });
          if (taken) {
            finalUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
          }

          user = await User.create({
            firebaseUid: firebaseData.localId,
            email: (firebaseData.email || loginEmail).toLowerCase(),
            username: finalUsername,
            fullName: firebaseData.displayName || '',
            authProvider: 'credentials',
            role: 'student',
          });
        }

        if (user.isDisabled) throw new Error('Your account has been disabled. Contact admin.');

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName || user.username,
          role: user.role,
        };
      }
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Keep static admin login fully local.
      if (user.email === STATIC_ADMIN_EMAIL) {
        return true;
      }

      if (!user.email) return false;

      try {
        await connectUsersDb();

        let existingUser = await User.findOne({ email: user.email.toLowerCase().trim() });

        if (!existingUser) {
          const baseUsername = user.email.split('@')[0].toLowerCase();
          let finalUsername = baseUsername;
          const taken = await User.findOne({ username: finalUsername });
          if (taken) {
            finalUsername = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;
          }

          existingUser = await User.create({
            email: user.email.toLowerCase().trim(),
            username: finalUsername,
            fullName: user.name || '',
            image: user.image || undefined,
            authProvider: account?.provider === 'google' ? 'google' : 'credentials',
            role: 'student',
          });
        } else {
          if (existingUser.isDisabled) {
            return false;
          }

          existingUser.fullName = user.name || existingUser.fullName;
          existingUser.image = user.image || existingUser.image;
          if (account?.provider === 'google') {
            existingUser.authProvider = 'google';
          }
          await existingUser.save();
        }

        (user as any).mongoUserId = existingUser._id.toString();
        (user as any).role = existingUser.role;
        return true;
      } catch (error) {
        console.error('Error during signIn callback:', error);
        return false;
      }
    },

    // Stamp user data onto the JWT token when they first log in
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).mongoUserId || user.id;
        token.role = (user as any).role || token.role || 'student';
      }

      if (!token.id && token.email && token.email !== STATIC_ADMIN_EMAIL) {
        await connectUsersDb();
        const dbUser = await User.findOne({ email: String(token.email).toLowerCase().trim() });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }

      if (token.email === STATIC_ADMIN_EMAIL) {
        token.id = 'static-admin';
        token.role = 'admin';
      }

      return token;
    },

    // Pass token data to the session so useSession() has it
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/',
  },
});
