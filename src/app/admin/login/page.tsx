"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0B0F1A] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-8"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(99,102,241,0.15)]">
            <Lock size={24} strokeWidth={1.75} className="text-[#6366F1]" />
          </div>
          <h1 className="font-heading text-xl font-bold text-[#F8FAFC]">
            Admin Access
          </h1>
          <p className="text-sm text-[#64748B]">Enter password to continue</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-6 w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-4 py-3 text-sm text-[#F8FAFC] outline-none placeholder:text-[#64748B] focus:border-[#6366F1]"
        />

        {error && (
          <p className="mt-2 text-sm text-[#EF4444]">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#6366F1] py-3 text-sm font-medium text-white transition-colors hover:bg-[#818CF8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
}
