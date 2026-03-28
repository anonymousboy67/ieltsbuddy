import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { Search, Star, MessageSquare } from "lucide-react";

export default async function TutorsMarketplace() {
  const session = await auth();
  
  await dbConnect();

  // Find all teachers who have opted into the freelance gig pool
  const tutors = await User.find({ role: "teacher", isFreelance: true }).lean();

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Find an IELTS Coach
          </h1>
          <p className="text-slate-400 mt-2">Book 1-on-1 personalized sessions with top-rated professional tutors.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="w-full bg-[#131B2C] border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors.length === 0 ? (
          <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-[#131B2C]/50">
            <h3 className="text-xl text-slate-300 font-medium mb-2">No active tutors right now.</h3>
            <p className="text-slate-500">Check back later as our associated educators open their freelance schedules.</p>
          </div>
        ) : (
          tutors.map((tutor: any) => (
            <div key={tutor._id.toString()} className="bg-[#131B2C] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                  {tutor.image ? (
                    <img src={tutor.image} alt={tutor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                      {(tutor.name || "T")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{tutor.name || "Professional Educator"}</h3>
                  <div className="flex items-center text-yellow-400 text-sm font-medium mt-1">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    <span>4.9</span>
                    <span className="text-slate-500 ml-1 font-normal">(12 reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-slate-800/50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Hourly Rate</p>
                  <p className="font-bold text-emerald-400 text-lg">${tutor.hourlyRate || 20}</p>
                </div>
                <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl transition">
                  <MessageSquare className="w-4 h-4" />
                  Request
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
