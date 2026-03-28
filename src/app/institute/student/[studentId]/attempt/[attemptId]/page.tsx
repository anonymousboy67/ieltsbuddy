import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import UserAttempt from "@/models/UserAttempt";
import User from "@/models/User";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, PlayCircle } from "lucide-react";

import { cookies } from "next/headers";

export default async function AttemptReviewPage({ params }: { params: Promise<{ studentId: string, attemptId: string }> }) {
  const session = await auth();
  const adminToken = (await cookies()).get("admin_session");
  const isAdmin = adminToken?.value === "ieltsbuddy_admin_authenticated" || session?.user?.role === "admin" || session?.user?.email === "admin@ieltsbuddy.com";

  if (!session?.user && !isAdmin) redirect("/dashboard/login");

  const role = session?.user?.role || "student";
  const instituteId = session?.user?.instituteId;

  if (!isAdmin && !["institute", "teacher"].includes(role)) {
    redirect("/dashboard");
  }

  const { studentId, attemptId } = await params;
  await dbConnect();

  const student = await User.findById(studentId).lean();
  if (!student) redirect("/dashboard");

  if (process.env.NODE_ENV !== "development" && !isAdmin && role === "institute" && (!student.instituteId || student.instituteId.toString() !== instituteId?.toString())) {
    return <div className="p-8 text-center text-slate-400">Permission denied.</div>;
  }

  const attempt = await UserAttempt.findById(attemptId).lean();
  if (!attempt || attempt.userId.toString() !== studentId) {
    return <div className="p-8 text-center text-slate-400">Attempt not found.</div>;
  }

  // Helper renderers
  const renderObjectiveTable = () => {
    if (!attempt.answers || attempt.answers.length === 0) {
      return <p className="text-slate-400 p-4 text-center">No answers recorded.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#94A3B8]">
          <thead className="bg-[#0F1523] text-xs uppercase text-[#F8FAFC]">
            <tr>
              <th className="px-5 py-3 rounded-tl-lg">Q#</th>
              <th className="px-5 py-3">Student Answer</th>
              <th className="px-5 py-3">Correct Answer</th>
              <th className="px-5 py-3 rounded-tr-lg">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {attempt.answers.map((ans: any, i: number) => (
              <tr key={i} className="hover:bg-[#1A2235] transition-colors">
                <td className="px-5 py-3 font-medium text-white">{ans.questionNumber}</td>
                <td className="px-5 py-3 font-mono text-sm">{ans.userAnswer || "-"}</td>
                <td className="px-5 py-3 font-mono text-sm">{ans.correctAnswer || "-"}</td>
                <td className="px-5 py-3">
                  {ans.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md text-xs font-semibold">
                      <CheckCircle size={14} /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-400/10 px-2 py-1 rounded-md text-xs font-semibold">
                      <XCircle size={14} /> Incorrect
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubjectiveFeedback = () => {
    const isWriting = attempt.sectionType === "writing";
    const feedback = isWriting ? attempt.writingFeedback : attempt.speakingFeedback;
    const response = isWriting ? attempt.writingResponse : null;

    if (attempt.status !== "completed") {
      return (
        <div className="p-8 text-center border border-amber-500/20 bg-amber-500/5 rounded-xl">
          <AlertCircle size={32} className="mx-auto text-amber-500 mb-3" />
          <h3 className="text-white font-medium">Evaluation Pending</h3>
          <p className="text-slate-400 text-sm mt-1">The AI is currently analyzing this submission. Check back soon.</p>
        </div>
      );
    }

    if (!feedback) {
      return <p className="text-slate-400 p-4 text-center">Feedback data missing.</p>;
    }

    const criteria = isWriting ? [
      { label: "Task Achievement", data: feedback.taskAchievement },
      { label: "Coherence & Cohesion", data: feedback.coherenceCohesion },
      { label: "Lexical Resource", data: feedback.lexicalResource },
      { label: "Grammatical Range", data: feedback.grammaticalRange },
    ] : [
      { label: "Fluency & Coherence", data: feedback.fluencyCoherence },
      { label: "Lexical Resource", data: feedback.lexicalResource },
      { label: "Grammatical Range", data: feedback.grammaticalRange },
      { label: "Pronunciation", data: feedback.pronunciation },
    ];

    return (
      <div className="space-y-6">
        {response && (
          <div className="bg-[#0F1523] border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Student Submission</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{response}</p>
          </div>
        )}

        {attempt.sectionType === "speaking" && attempt.speakingResponses && attempt.speakingResponses.length > 0 && (
          <div className="bg-[#0F1523] border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Audio Recordings</h3>
            {attempt.speakingResponses.map((res: any, i: number) => (
              <div key={i} className="flex items-center gap-4 bg-[#1A2235] p-3 rounded-lg border border-slate-800">
                <PlayCircle size={24} className="text-purple-400" />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">Part {res.partNumber} {res.questionNumber ? `(Q${res.questionNumber})` : ""}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{res.transcript || "No transcript available"}</p>
                </div>
                {res.audioUrl ? (
                   <audio controls src={res.audioUrl} className="h-8 w-48" />
                ) : (
                  <span className="text-xs text-slate-500">Audio missing</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">Overall Feedback</h3>
          <p className="text-white text-sm leading-relaxed">{feedback.overallFeedback}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteria.map((c, i) => (
            <div key={i} className="bg-[#131B2C] border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-200">{c.label}</h4>
                <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded text-sm">{c.data?.score || "-"}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{c.data?.feedback || "No specific feedback provided."}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
      <Link href={`/institute/student/${studentId}`} className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F8FAFC] transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Student Profile
      </Link>

      <div className="bg-[#131B2C] border border-slate-800 rounded-xl overflow-hidden mb-6">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-[#131B2C] to-[#131B2C]">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 uppercase tracking-wider text-[10px] font-bold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {attempt.sectionType}
              </span>
              <span className="text-sm text-slate-400 font-medium">Book {attempt.bookNumber} • Test {attempt.testNumber}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Attempt Review
            </h1>
            <p className="text-sm text-slate-400">
              Completed {new Date(attempt.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-[#0F1523] border border-slate-700 rounded-2xl p-4 min-w-[140px] text-center shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Band Score</p>
            <div className={`text-4xl font-black ${attempt.bandScore >= 7 ? 'text-emerald-400' : attempt.bandScore >= 6 ? 'text-amber-400' : 'text-rose-400'}`}>
              {attempt.bandScore !== undefined ? attempt.bandScore.toFixed(1) : "--"}
            </div>
            {attempt.correctCount !== undefined && (
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {attempt.correctCount} / {attempt.totalQuestions || 40} Correct
              </p>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8">
          {['reading', 'listening'].includes(attempt.sectionType) 
            ? renderObjectiveTable() 
            : renderSubjectiveFeedback()}
        </div>
      </div>
    </div>
  );
}
