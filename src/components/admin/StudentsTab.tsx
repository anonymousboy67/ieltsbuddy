"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Toast {
  message: string;
  type: "success" | "error";
}

interface Student {
  _id: string;
  name?: string;
  email: string;
  quotaConsumed?: number;
  instituteId?: string;
  createdAt: string;
}

export default function StudentsTab({ onToast }: { onToast: (m: string, t: "success" | "error") => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => {
        setStudents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        onToast("Failed to fetch students", "error");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [onToast]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#6366F1]" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#F8FAFC]">All Students</h2>
        <span className="rounded-full bg-[#12172B] px-3 py-1 text-xs text-[#94A3B8]">
          Total: {students.length}
        </span>
      </div>

      {students.length === 0 ? (
        <p className="text-center text-sm text-[#94A3B8] py-8">No students found.</p>
      ) : (
        <ul className="divide-y divide-[#2A3150]">
          {students.map((s) => (
            <li key={s._id} className="group flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC]">{s.name || "Unnamed Student"}</p>
                <p className="text-xs text-[#94A3B8]">{s.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#64748B]">Quota: {s.quotaConsumed || 0}</span>
                <Link
                  href={`/institute/student/${s._id}`}
                  className="rounded-lg bg-[rgba(99,102,241,0.1)] px-3 py-1.5 text-xs font-medium text-[#818CF8] opacity-0 transition-all hover:bg-[#6366F1] hover:text-white group-hover:opacity-100"
                >
                  View Profile
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
