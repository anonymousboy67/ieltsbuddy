import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "./mongodb";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.email }).select("+password").lean();
          if (!user || !user.password) return null;
          
          const isValid = await bcrypt.compare(credentials.password as string, user.password as string);
          if (!isValid) return null;
          
          return {
             id: (user._id as object).toString(),
             email: user.email,
             name: user.name,
             image: user.image,
             role: user.role,
          };
        } catch (err) {
          console.error("[auth] Credentials authorize error:", err);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;
      try {
        await dbConnect();
        const existing = await User.findOne({ email: user.email });
        if (!existing) {
          await User.create({
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: account?.providerAccountId,
            role: "student",
          });
        } else {
          await User.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name || existing.name,
                image: user.image || existing.image,
                googleId: account?.providerAccountId || existing.googleId,
              },
            }
          );
        }
      } catch (error) {
        console.error("[auth] signIn DB error:", error);
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user || trigger === "signIn" || trigger === "update") {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email }).lean();
          if (dbUser) {
            token.id = (dbUser._id as object).toString();
            token.onboardingComplete = dbUser.onboardingComplete ?? false;
            token.role = dbUser.role || "student";
            token.instituteId = dbUser.instituteId ? (dbUser.instituteId as object).toString() : null;
            token.teacherId = dbUser.teacherId ? (dbUser.teacherId as object).toString() : null;
          }
        } catch (error) {
          console.error("[auth] jwt DB error:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as "admin" | "institute" | "teacher" | "student") || "student";
        session.user.instituteId = (token.instituteId as string) || null;
        session.user.teacherId = (token.teacherId as string) || null;
        (session as any).onboardingComplete = token.onboardingComplete ?? false;
      }
      return session;
    },
  },
});
