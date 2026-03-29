import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Institute from "@/models/Institute";
import User from "@/models/User";
import { Users, BookOpen, GraduationCap, Crown, Gem, Calendar } from "lucide-react";
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
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${
              institute.plan === "platinum" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" :
              institute.plan === "silver" ? "bg-slate-500/10 text-slate-300 border border-slate-400/30" :
              "bg-blue-500/10 text-blue-400 border border-blue-500/30"
            }`}>
              {institute.plan === "platinum" ? <Gem className="w-3.5 h-3.5" /> :
               institute.plan === "silver" ? <Crown className="w-3.5 h-3.5" /> :
               <Users className="w-3.5 h-3.5" />}
              {institute.plan || "basic"} plan
            </span>
            {institute.validUntil && (
              <span className={`inline-flex items-center gap-1.5 text-xs ${
                new Date(institute.validUntil) < new Date() ? "text-red-400" : "text-slate-400"
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                Valid until {new Date(institute.validUntil).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <AddUserModal instituteId={institute._id.toString()} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-300 font-medium">Students</h3>
            <GraduationCap className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{students.length} / {institute.maxStudents || 50}</p>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${students.length >= (institute.maxStudents || 50) ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min((students.length / (institute.maxStudents || 50)) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{(institute.maxStudents || 50) - students.length} slots remaining</p>
        </div>

        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <BookOpen className="w-8 h-8 text-emerald-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Active Teachers</h3>
          <p className="text-3xl font-bold text-white mt-1">{teachers.length}</p>
        </div>

        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-300 font-medium">Daily Limits per Student</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Live Speaking</span>
              <span className="text-white font-medium">1 session (12 min)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Mock Test</span>
              <span className="text-white font-medium">1 per day</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Writing Eval</span>
              <span className="text-white font-medium">2 per day</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Speaking Eval</span>
              <span className="text-white font-medium">2 per day</span>
            </div>
          </div>
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
                  <li key={s._id.toString()} className="py-3 flex justify-between items-center group">
                    <div>
                      <p className="text-white font-medium">{s.name || "Unnamed Student"}</p>
                      <p className="text-slate-400 text-xs">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-300">Quota Used: <span className="text-white font-bold">{s.quotaConsumed || 0}</span></p>
                      </div>
                      <a href={`/institute/student/${s._id.toString()}`} className="text-xs text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Profile
                      </a>
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

