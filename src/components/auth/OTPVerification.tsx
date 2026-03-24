"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { verifyOTPAndSignUp } from "@/lib/auth-utils";

interface OTPVerificationProps {
  email: string;
  username: string;
  password: string;
  fullName: string;
  onBack: () => void;
}

export default function OTPVerification({
  email,
  username,
  password,
  fullName,
  onBack,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (otp.trim().length !== 6) {
        throw new Error("Enter the 6-digit verification code.");
      }

      await verifyOTPAndSignUp(email, otp.trim(), username, fullName, password);
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-800"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="mb-6 text-center">
        <h3 className="font-heading text-xl font-bold text-stone-800">Verify Email</h3>
        <p className="mt-2 text-sm text-stone-600">
          Enter the 6-digit code sent to {email}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="w-full rounded-xl border border-stone-200 bg-[#FDF8F2] px-4 py-3 text-center text-lg tracking-[0.3em] text-stone-800 outline-none transition-all focus:border-emerald-700 focus:shadow-[0_0_0_1px_rgba(4,120,87,0.28)]"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Continue"}
        </button>
      </form>
    </div>
  );
}
