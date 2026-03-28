import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "admin" | "institute" | "teacher" | "student";
      instituteId?: string | null;
      teacherId?: string | null;
    };
    onboardingComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    onboardingComplete: boolean;
    role: "admin" | "institute" | "teacher" | "student";
    instituteId?: string | null;
    teacherId?: string | null;
  }
}
