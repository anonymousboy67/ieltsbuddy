"use client";

import { useEffect, useState } from "react";
import { X, Mail, Lock, User, Chrome, ArrowRight, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import OTPVerification from "./OTPVerification";

const STATIC_ADMIN_EMAIL = "admin@iletsbuddy.com";


interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signup",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup" | "otp">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setError("");
      // Trigger NextAuth Google login
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const identifier = email || username;
        // Resolve email if username was provided
        const resolveRes = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(identifier)}`);
        const resolveData = await resolveRes.json();
        if (!resolveRes.ok) throw new Error(resolveData.error || "User not found.");

        const redirectTo =
          String(resolveData.email || "").toLowerCase() === STATIC_ADMIN_EMAIL
            ? "/admin"
            : "/dashboard";

        const result = await (signIn("credentials", {
          email: resolveData.email,
          password: password,
          redirect: true,
          redirectTo,
        }) as any);

        if (result?.error) {
          throw new Error(result.error);
        }

        onClose();

      } else {
        // Sign up: trigger OTP
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMode("otp");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 pt-6 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative my-2 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto animate-in fade-in zoom-in rounded-2xl border border-stone-200 bg-[#F8F5F1] p-6 shadow-[0_14px_40px_rgba(41,37,36,0.16)] duration-300 sm:my-4 sm:max-h-[85dvh] sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-stone-500 transition-colors hover:text-stone-800"
        >
          <X size={20} />
        </button>

        {mode === "otp" ? (
          <OTPVerification
            email={email}
            username={username}
            password={password}
            fullName={fullName}
            onBack={() => setMode("signup")}
          />
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-stone-800">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {mode === "login"
                  ? "Log in to continue your IELTS journey"
                  : "Join thousands of students preparing for success"}
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-stone-200 bg-[#FDF8F2] px-5 py-3 text-sm font-semibold text-stone-700 transition-all duration-200 hover:bg-stone-100 disabled:opacity-60"
            >
              <Chrome size={18} className="text-stone-700" />
              {mode === "login" ? "Continue with Google" : "Register with Google"}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#F8F5F1] px-3 font-medium text-stone-400">
                  OR
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-400">
                {error}
              </div>
            )}

            {/* Login/Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-medium text-stone-600">Full Name</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-emerald-700" />
                      <input
                        type="text"
                        placeholder="Pradip Kandel"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-[#FDF8F2] py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition-all focus:border-emerald-700 focus:shadow-[0_0_0_1px_rgba(4,120,87,0.28)]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-medium text-stone-600">Username</label>
                    <div className="relative group">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-emerald-700" />
                      <input
                        type="text"
                        placeholder="pradip_kandel"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-[#FDF8F2] py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition-all focus:border-emerald-700 focus:shadow-[0_0_0_1px_rgba(4,120,87,0.28)]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-stone-600">
                  {mode === "login" ? "Email or Username" : "Email"}
                </label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-emerald-700" />
                  <input
                    type={mode === "login" ? "text" : "email"}
                    placeholder={mode === "login" ? "Enter your identifier" : "name@example.com"}
                    required
                    value={mode === "login" ? (email || username) : email}
                    onChange={(e) => mode === "login" ? setEmail(e.target.value) : setEmail(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FDF8F2] py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition-all focus:border-emerald-700 focus:shadow-[0_0_0_1px_rgba(4,120,87,0.28)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="ml-1 text-xs font-medium text-stone-600">Password</label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-emerald-700" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#FDF8F2] py-3 pl-11 pr-4 text-sm text-stone-800 outline-none transition-all focus:border-emerald-700 focus:shadow-[0_0_0_1px_rgba(4,120,87,0.28)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Log In" : "Sign Up"}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-stone-500">
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="font-semibold text-emerald-700 transition-colors hover:text-teal-700"
                >
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
