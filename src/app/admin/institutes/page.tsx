import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Institute from "@/models/Institute";
import User from "@/models/User";
import { Building2, Users, Calendar } from "lucide-react";
import Link from "next/link";
import AddInstituteModal from "./AddInstituteModal";

export default async function AdminInstitutesPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  await dbConnect();

  // Fetch all institutes
  const institutes = await Institute.find().sort({ createdAt: -1 }).lean();
  
  // Fetch some aggregate stats (mocked aggregation for simplicity in UI)
  const totalStudents = await User.countDocuments({ role: "student", instituteId: { $ne: null } });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Platform Administration
          </h1>
          <p className="text-slate-400 mt-2">Manage Institutes, Teachers, and API Quotas.</p>
        </div>
        <AddInstituteModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <Building2 className="w-8 h-8 text-cyan-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Total Institutes</h3>
          <p className="text-3xl font-bold text-white mt-1">{institutes.length}</p>
        </div>
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <Users className="w-8 h-8 text-blue-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Affiliated Students</h3>
          <p className="text-3xl font-bold text-white mt-1">{totalStudents}</p>
        </div>
        <div className="bg-[#131B2C] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
          <Calendar className="w-8 h-8 text-purple-400 mb-2" />
          <h3 className="text-slate-300 font-medium">Active Plans</h3>
          <p className="text-3xl font-bold text-white mt-1">{institutes.filter((i: any) => i.status === "active").length}</p>
        </div>
      </div>

      <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Registered Institutes</h2>
        </div>
        {institutes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No institutes registered yet.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#0F1523] text-slate-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Institute Name</th>
                <th className="px-6 py-4 font-medium">Contact Email</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Students</th>
                <th className="px-6 py-4 font-medium">Valid Until</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {institutes.map((inst: any) => (
                <tr key={inst._id.toString()} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4 font-medium text-white">{inst.name}</td>
                  <td className="px-6 py-4 text-slate-300">{inst.contactEmail}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
                      inst.plan === "platinum" ? "bg-purple-500/10 text-purple-400" :
                      inst.plan === "silver" ? "bg-slate-500/10 text-slate-300" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {inst.plan || "basic"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{inst.maxStudents || 50} max</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{inst.validUntil ? new Date(inst.validUntil).toLocaleDateString() : "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      inst.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {inst.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/institutes/${inst._id}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
