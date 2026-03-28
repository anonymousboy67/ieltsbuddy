import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserAttempt from "@/models/UserAttempt";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, FileText, Headphones, BookOpen, PenLine } from "lucide-react";

import { cookies } from "next/headers";

const getSectionIcon = (type: string) => {
  switch (type) {
    case "listening": return <Headphones size={18} className="text-[#22C55E]" />;
    case "reading": return <BookOpen size={18} className="text-[#A855F7]" />;
    case "writing": return <PenLine size={18} className="text-[#F59E0B]" />;
    default: return <FileText size={18} className="text-[#64748B]" />;
  }
};

export default async function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const session = await auth();
  const adminToken = (await cookies()).get("admin_session");
  const isAdmin = adminToken?.value === "ieltsbuddy_admin_authenticated" || session?.user?.role === "admin" || session?.user?.email === "admin@ieltsbuddy.com";

  if (!session?.user && !isAdmin) redirect("/dashboard/login");

  const role = session?.user?.role || "student";
  const instituteId = session?.user?.instituteId;

  if (!isAdmin && !["institute", "teacher"].includes(role)) {
    redirect("/dashboard");
  }

  const { studentId } = await params;
  await dbConnect();

  // Validate student
  const student = await User.findById(studentId).lean();
  if (!student) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400">
        <p>Student not found.</p>
        <Link href="/dashboard" className="mt-4 text-purple-400 hover:text-purple-300">Return to Dashboard</Link>
      </div>
    );
  }

  // Security barrier: If institute or teacher, verify the student belongs to them
  if (process.env.NODE_ENV !== "development" && !isAdmin && role === "institute") {
    if (!student.instituteId || student.instituteId.toString() !== instituteId?.toString()) {
      return (
        <div className="flex-1 p-8 text-center text-slate-400">
          <p>You don't have permission to view this student.</p>
        </div>
      );
    }
  }

  // Teacher validation can be added here if needed, comparing teacherId.

  // Fetch attempts
  const attempts = await UserAttempt.find({ userId: studentId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link href={role === "admin" ? "/admin" : "/institute"} className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{student.name || "Unnamed Student"}</h1>
            <p className="text-slate-400 mt-1">{student.email}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-6">
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Target Band</p>
              <p className="text-xl font-bold text-white mt-1">{student.targetBand || "N/A"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Attempts</p>
              <p className="text-xl font-bold text-white mt-1">{attempts.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Quota Used</p>
              <p className="text-xl font-bold text-white mt-1">{student.quotaConsumed || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Test History</h2>
        {attempts.length === 0 ? (
          <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            No test attempts recorded yet.
          </div>
        ) : (
          <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden">
            <ul className="divide-y divide-slate-800">
              {attempts.map((attempt: any) => {
                const dateNum = new Date(attempt.createdAt);
                const displayDate = dateNum.toLocaleDateString() + " " + dateNum.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <li key={attempt._id.toString()} className="group hover:bg-[#1E2540] transition-colors">
                    <Link href={`/institute/student/${studentId}/attempt/${attempt._id.toString()}`} className="flex flex-col md:flex-row md:items-center justify-between p-5">
                      <div className="flex items-start md:items-center gap-4">
                        <div className="mt-1 md:mt-0 flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F1523] border border-slate-800 group-hover:border-slate-700 transition-colors">
                          {getSectionIcon(attempt.sectionType)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white capitalize">{attempt.sectionType} Section</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                              Book {attempt.bookNumber} • Test {attempt.testNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><Clock size={12} /> {displayDate}</span>
                            <span className="capitalize text-slate-500">• {attempt.mode}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                        <div className="text-left md:text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status</p>
                          <p className={`text-sm font-medium mt-0.5 capitalize ${attempt.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {attempt.status}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Band Score</p>
                          <p className="text-lg font-bold text-white mt-0.5">
                            {attempt.bandScore !== undefined ? attempt.bandScore : "--"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
