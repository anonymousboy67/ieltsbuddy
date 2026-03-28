import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import MeetingRequest from "@/models/MeetingRequest";
import { BarChart2, Video, FileText, Upload } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await auth();

  // Guard: Only Teachers can access
  if (!session?.user || session.user.role !== "teacher") {
    redirect("/dashboard");
  }

  await dbConnect();

  // Fetch students assigned to this specific teacher
  // Or if institute-wide, fetch all students in the institute. Let's assume assigned directly.
  const myStudents = await User.find({ role: "student", teacherId: session.user.id }).lean();
  
  // Fetch pending meeting requests
  const pendingMeetings = await MeetingRequest.find({ teacherId: session.user.id, status: "pending" })
    .populate("studentId", "name email")
    .lean();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            Teacher Portal
          </h1>
          <p className="text-slate-400 mt-2">Welcome back, {session.user.name || "Educator"}. Monitor your students and upload resources.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 transition">
          <Upload className="w-8 h-8 text-emerald-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Upload Resource</h3>
          <p className="text-sm text-slate-500 mt-1">Share PDFs or Links</p>
        </div>
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <UsersIcon className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-slate-300 font-medium">My Students</h3>
          <p className="text-3xl font-bold text-white mt-1">{myStudents.length}</p>
        </div>
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <Video className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Meeting Requests</h3>
          <p className="text-3xl font-bold text-white mt-1">{pendingMeetings.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Roster & Analytics */}
        <div className="lg:col-span-2 bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-[#0F1523]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              Student Performance Analytics
            </h2>
          </div>
          <div className="p-0">
            {myStudents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12">No students have been assigned to you yet.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#0b101a] text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 font-medium">Student</th>
                    <th className="px-6 py-3 font-medium">Target Band</th>
                    <th className="px-6 py-3 font-medium">AI Tests Taken</th>
                    <th className="px-6 py-3 font-medium text-right">View Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {myStudents.map((s: any) => (
                    <tr key={s._id.toString()} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{s.name || "Unnamed Student"}</p>
                        <p className="text-slate-400 text-xs">{s.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-800 text-teal-400 px-2 py-1 rounded text-xs font-bold">
                          {s.targetBand || 6.5}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{s.quotaConsumed || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                          Analyze Mistakes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Meeting Requests Sidebar */}
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-slate-800 bg-[#0F1523]">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-400" />
              Coaching Requests
            </h2>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {pendingMeetings.length === 0 ? (
              <p className="text-slate-400 text-sm italic text-center py-8">Inbox zero. No coaching requests.</p>
            ) : (
              <div className="space-y-4">
                {pendingMeetings.map((mr: any) => (
                  <div key={mr._id.toString()} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
                    <p className="text-white font-medium text-sm">{(mr.studentId as any)?.name || "A Student"}</p>
                    <p className="text-slate-400 text-xs mb-3">{mr.topic || "General Coaching Session"}</p>
                    <button className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium py-2 rounded transition">
                      Approve & Send Zoom Link
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
