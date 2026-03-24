"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Target,
  Calendar,
  Clock,
  Volume2,
  Send,
  Type,
  Moon,
  Bell,
  Mail,
  Users,
  LogIn,
  Loader2,
  CheckCircle,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */

interface Settings {
  targetBand: number;
  examDate: string;
  weakSections: string[];
  dailyStudyHours: number;
  timerSounds: boolean;
  autoSubmit: boolean;
  fontSize: "small" | "medium" | "large";
  theme: "dark" | "light";
  dailyReminder: boolean;
  weeklyEmail: boolean;
  practiceAlerts: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  targetBand: 6.5,
  examDate: "",
  weakSections: [],
  dailyStudyHours: 2,
  timerSounds: true,
  autoSubmit: false,
  fontSize: "medium",
  theme: "dark",
  dailyReminder: true,
  weeklyEmail: false,
  practiceAlerts: true,
};

const BAND_SCORES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
const SECTIONS = ["Listening", "Reading", "Writing", "Speaking"];

const inputCls =
  "w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors focus:border-[#6366F1]";

/* ── Component ────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Fetch settings
  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    fetch("/api/user/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            examDate: data.examDate
              ? new Date(data.examDate).toISOString().split("T")[0]
              : "",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        // Mark initial load done after state settles
        setTimeout(() => { initialLoadRef.current = false; }, 100);
      });
  }, [status]);

  // Auto-save on change
  const save = useCallback(
    (newSettings: Settings) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/user/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newSettings,
              examDate: newSettings.examDate || undefined,
            }),
          });
          if (res.ok) {
            setToast(true);
            setTimeout(() => setToast(false), 2000);
          }
        } catch {
          // silent fail
        }
      }, 500);
    },
    []
  );

  const update = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (!initialLoadRef.current) save(next);
        return next;
      });
    },
    [save]
  );

  // Exam countdown
  const daysUntilExam = settings.examDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(settings.examDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  /* ── Not authenticated ──────────────────────────────────────── */

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={32} strokeWidth={1.75} className="animate-spin text-[#6366F1]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-[15px] text-[#94A3B8]">
          Sign in to access your settings
        </p>
        <button
          onClick={() => signIn("google")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#818CF8]"
        >
          <LogIn size={18} strokeWidth={1.75} />
          Sign in with Google
        </button>
      </div>
    );
  }

  /* ── Toggle component ───────────────────────────────────────── */

  function Toggle({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
          value ? "bg-[#6366F1]" : "bg-[#2A3150]"
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <>
      <div className="animate-fade-up">
        <h1 className="font-heading text-[28px] font-bold text-[#F8FAFC]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Customize your study experience
        </p>
      </div>

      {/* ── Profile section ───────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-1 mt-6">
        <h2 className="font-heading text-lg font-semibold text-[#F8FAFC]">
          Profile
        </h2>

        <div className="mt-4 space-y-4">
          {/* Target band */}
          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(99,102,241,0.15)]">
                <Target size={20} strokeWidth={1.75} className="text-[#6366F1]" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Target Band Score</p>
                <p className="text-[13px] text-[#64748B]">Your goal IELTS band</p>
              </div>
            </div>
            <select
              value={settings.targetBand}
              onChange={(e) => update({ targetBand: Number(e.target.value) })}
              className="rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1]"
            >
              {BAND_SCORES.map((b) => (
                <option key={b} value={b}>{b.toFixed(1)}</option>
              ))}
            </select>
          </div>

          {/* Exam date */}
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[rgba(249,115,22,0.15)]">
                  <Calendar size={20} strokeWidth={1.75} className="text-[#F97316]" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-[#F8FAFC]">Exam Date</p>
                  <p className="text-[13px] text-[#64748B]">
                    {daysUntilExam !== null
                      ? `${daysUntilExam} days remaining`
                      : "Not set"}
                  </p>
                </div>
              </div>
              <input
                type="date"
                value={settings.examDate}
                onChange={(e) => update({ examDate: e.target.value })}
                className="w-full rounded-lg border-[0.5px] border-[#2A3150] bg-[#12172B] px-3 py-2 text-sm text-[#F8FAFC] outline-none focus:border-[#6366F1] sm:w-auto"
              />
            </div>
          </div>

          {/* Weak sections */}
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <p className="text-[15px] font-medium text-[#F8FAFC]">Weak Sections</p>
            <p className="mt-1 text-[13px] text-[#64748B]">Select sections you want to focus on</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SECTIONS.map((s) => {
                const active = settings.weakSections.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => {
                      const next = active
                        ? settings.weakSections.filter((w) => w !== s)
                        : [...settings.weakSections, s];
                      update({ weakSections: next });
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#12172B] text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily study hours */}
          <div className="rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-[rgba(34,197,94,0.15)]">
                <Clock size={20} strokeWidth={1.75} className="text-[#22C55E]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[#F8FAFC]">Daily Study Hours</p>
                <p className="text-[13px] text-[#64748B]">{settings.dailyStudyHours}h per day</p>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={settings.dailyStudyHours}
              onChange={(e) => update({ dailyStudyHours: Number(e.target.value) })}
              className="mt-3 w-full accent-[#6366F1]"
            />
          </div>
        </div>
      </section>

      {/* ── Study Preferences ─────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-2 mt-8">
        <h2 className="font-heading text-lg font-semibold text-[#F8FAFC]">
          Study Preferences
        </h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Volume2 size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Timer Sounds</p>
                <p className="text-[13px] text-[#64748B]">Play sounds when timer ends</p>
              </div>
            </div>
            <Toggle value={settings.timerSounds} onChange={(v) => update({ timerSounds: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Send size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Auto-Submit</p>
                <p className="text-[13px] text-[#64748B]">Submit test automatically when time runs out</p>
              </div>
            </div>
            <Toggle value={settings.autoSubmit} onChange={(v) => update({ autoSubmit: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Type size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Font Size</p>
                <p className="text-[13px] text-[#64748B]">Reading passage text size</p>
              </div>
            </div>
            <div className="flex gap-1">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    settings.fontSize === size
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#12172B] text-[#94A3B8]"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Moon size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Theme</p>
                <p className="text-[13px] text-[#64748B]">App appearance</p>
              </div>
            </div>
            <div className="flex gap-1">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => update({ theme: t })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    settings.theme === t
                      ? "bg-[#6366F1] text-white"
                      : "bg-[#12172B] text-[#94A3B8]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Notifications ─────────────────────────────────────── */}
      <section className="animate-fade-up animate-fade-up-3 mt-8 pb-8">
        <h2 className="font-heading text-lg font-semibold text-[#F8FAFC]">
          Notifications
        </h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Bell size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Daily Study Reminder</p>
                <p className="text-[13px] text-[#64748B]">Get reminded to practice every day</p>
              </div>
            </div>
            <Toggle value={settings.dailyReminder} onChange={(v) => update({ dailyReminder: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Mail size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Weekly Progress Email</p>
                <p className="text-[13px] text-[#64748B]">Receive your weekly stats by email</p>
              </div>
            </div>
            <Toggle value={settings.weeklyEmail} onChange={(v) => update({ weeklyEmail: v })} />
          </div>

          <div className="flex items-center justify-between rounded-xl border-[0.5px] border-[#2A3150] bg-[#1E2540] p-4">
            <div className="flex items-center gap-3">
              <Users size={20} strokeWidth={1.75} className="text-[#94A3B8]" />
              <div>
                <p className="text-[15px] font-medium text-[#F8FAFC]">Practice Room Alerts</p>
                <p className="text-[13px] text-[#64748B]">Notify when partners are available</p>
              </div>
            </div>
            <Toggle value={settings.practiceAlerts} onChange={(v) => update({ practiceAlerts: v })} />
          </div>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <CheckCircle size={16} strokeWidth={1.75} />
          Settings saved
        </div>
      )}
    </>
  );
}
