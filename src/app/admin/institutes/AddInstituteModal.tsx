"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddInstituteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    totalQuota: 100000,
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/institutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsOpen(false);
        setFormData({ name: "", contactEmail: "", totalQuota: 100000 });
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

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">AI Quota (Tests)</label>
                <input
                  required
                  type="number"
                  value={formData.totalQuota}
                  onChange={(e) => setFormData({ ...formData, totalQuota: parseInt(e.target.value) })}
                  className="w-full bg-[#0F1523] border border-slate-800 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none transition"
                />
              </div>

              <div className="pt-4">
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
