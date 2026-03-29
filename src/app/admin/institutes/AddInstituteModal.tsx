"use client";

import { useState } from "react";
import { Plus, X, Loader2, Users, Crown, Gem } from "lucide-react";
import { useRouter } from "next/navigation";

const PLANS = [
  { value: "basic", label: "Basic", maxStudents: 50, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { value: "silver", label: "Silver", maxStudents: 150, icon: Crown, color: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-400/30" },
  { value: "platinum", label: "Platinum", maxStudents: 400, icon: Gem, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
] as const;

export default function AddInstituteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    plan: "basic" as "basic" | "silver" | "platinum",
    validityMonths: 3,
  });
  const router = useRouter();

  const selectedPlan = PLANS.find((p) => p.value === formData.plan)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/institutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contactEmail: formData.contactEmail,
          plan: formData.plan,
          validityMonths: formData.validityMonths,
        }),
      });

      if (res.ok) {
        setIsOpen(false);
        setFormData({ name: "", contactEmail: "", plan: "basic", validityMonths: 3 });
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create institute");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:opacity-90 transition font-medium"
      >
        <Plus className="w-5 h-5" />
        Add Institute
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#131B2C] border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Register New Institute</h2>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Institute Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. British Council Global"
                  className="w-full bg-[#0F1523] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Contact Email</label>
                <input
                  required
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="admin@institute.com"
                  className="w-full bg-[#0F1523] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none transition"
                />
              </div>

              {/* Plan Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isSelected = formData.plan === plan.value;
                    return (
                      <button
                        key={plan.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, plan: plan.value })}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition ${
                          isSelected
                            ? `${plan.bg} ${plan.border} ${plan.color}`
                            : "border-slate-800 text-slate-500 hover:border-slate-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{plan.label}</span>
                        <span className="text-[10px] opacity-70">{plan.maxStudents} students</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validity Period */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Validity (months)</label>
                <select
                  value={formData.validityMonths}
                  onChange={(e) => setFormData({ ...formData, validityMonths: parseInt(e.target.value) })}
                  className="w-full bg-[#0F1523] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none transition"
                >
                  <option value={1}>1 month</option>
                  <option value={2}>2 months</option>
                  <option value={3}>3 months (recommended)</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>

              {/* Plan Summary */}
              <div className={`rounded-xl border ${selectedPlan.border} ${selectedPlan.bg} p-3`}>
                <p className={`text-xs font-medium ${selectedPlan.color}`}>Plan Summary</p>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>Max Students</span>
                  <span className="text-white font-medium">{selectedPlan.maxStudents}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>Validity</span>
                  <span className="text-white font-medium">{formData.validityMonths} month{formData.validityMonths > 1 ? "s" : ""}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0F1523] font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Confirm Registration"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
