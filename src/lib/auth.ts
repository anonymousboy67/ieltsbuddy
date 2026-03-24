import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import dbConnect from "./mongodb";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
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
      // On first sign-in or explicit update, fetch user data from DB
      if (user || trigger === "signIn" || trigger === "update") {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email }).lean();
          if (dbUser) {
            token.id = (dbUser._id as object).toString();
            token.onboardingComplete = dbUser.onboardingComplete ?? false;
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
        (session as any).onboardingComplete = token.onboardingComplete ?? false;
      }
      return session;
    },
  },
});
