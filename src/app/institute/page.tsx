import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Institute from "@/models/Institute";
import User from "@/models/User";
import { Users, BookOpen, GraduationCap, Plus } from "lucide-react";
import AddUserModal from "./AddUserModal";

export default async function InstituteDashboard() {
  const session = await auth();

  // Guard: Only Institutes can access
  if (!session?.user || session.user.role !== "institute") {
    redirect("/dashboard");
  }

  await dbConnect();
  
  // Fetch institute details based on their session instituteId
  const institute = await Institute.findById(session.user.instituteId).lean();
  if (!institute) redirect("/dashboard");

  // Fetch their teachers and students
  const teachers = await User.find({ role: "teacher", instituteId: institute._id }).lean();
  const students = await User.find({ role: "student", instituteId: institute._id }).lean();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            {institute.name} Portal
          </h1>
          <p className="text-slate-400 mt-2">Manage your AI quota, teachers, and enrolled students.</p>
        </div>
        <AddUserModal instituteId={institute._id.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-300 font-medium">AI Quota Status</h3>
            <DatabaseIcon />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{institute.usedQuota || 0} / {institute.totalQuota || 0}</p>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${Math.min(((institute.usedQuota || 0) / (institute.totalQuota || 1)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <BookOpen className="w-8 h-8 text-emerald-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Active Teachers</h3>
          <p className="text-3xl font-bold text-white mt-1">{teachers.length}</p>
        </div>

        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <GraduationCap className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Enrolled Students</h3>
          <p className="text-3xl font-bold text-white mt-1">{students.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teachers List */}
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-[#0F1523] flex justify-between items-center">
            <h2 className="font-bold text-white">Teachers</h2>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Generate Credential</button>
          </div>
          <div className="p-4">
            {teachers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No teachers added yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {teachers.map((t: any) => (
                  <li key={t._id.toString()} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{t.name || "Unnamed Teacher"}</p>
                      <p className="text-slate-400 text-xs">{t.email}</p>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-[#0F1523] flex justify-between items-center">
            <h2 className="font-bold text-white">Students</h2>
            <button className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded">Generate Credential</button>
          </div>
          <div className="p-4">
            {students.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No students enrolled yet.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {students.map((s: any) => (
                  <li key={s._id.toString()} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{s.name || "Unnamed Student"}</p>
                      <p className="text-slate-400 text-xs">{s.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">Quota Used: <span className="text-white font-bold">{s.quotaConsumed || 0}</span></p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DatabaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
  );
}
