"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { SUBJECT_COLORS } from "@/lib/types";
import { PlusIcon, XIcon, CheckIcon } from "./icons";

const HYD_COLLEGES = [
  "JNTU Hyderabad",
  "Osmania University",
  "University of Hyderabad",
  "IIIT Hyderabad",
  "IIT Hyderabad",
  "BITS Pilani Hyderabad",
  "NIT Warangal",
  "CBIT (Chaitanya Bharathi)",
  "Vasavi College of Engineering",
  "VNR VJIET",
  "MGIT",
  "GRIET",
  "Mahindra University",
  "Woxsen University",
  "Sreenidhi Institute (SNIST)",
  "CVR College of Engineering",
  "Malla Reddy Engineering College",
  "CMR College of Engineering",
  "SR Engineering College",
  "Vignan's Institute",
  "Gokaraju Rangaraju (GRIET)",
  "Stanley College of Engineering",
  "Chaitanya Engineering College",
  "KL University Hyderabad",
  "Anurag University",
  "Other",
];

const COURSES = [
  "B.Tech / B.E.", "BCA", "B.Sc", "B.Com", "BBA", "BA", "B.Pharm", "MBBS",
  "M.Tech / M.E.", "MCA", "M.Sc", "MBA", "MA", "M.Pharm", "MD",
  "Diploma", "PhD", "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

// ── Reusable bottom-sheet picker ──────────────────────────────────────────────
function PickerSheet({
  label,
  options,
  value,
  onSelect,
  onClose,
  searchable,
}: {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase()))
    : options;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#0e0e0e] border-t border-white/10 rounded-t-3xl max-h-[75vh] flex flex-col animate-fade-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />
        <p className="text-center text-sm font-bold text-ink pb-3 border-b border-white/[0.07] px-5">{label}</p>

        {searchable && (
          <div className="px-4 pt-3 pb-1">
            <input
              autoFocus
              className="input text-sm"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-4 py-2">
          {filtered.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); onClose(); }}
              className={`w-full flex items-center justify-between py-3.5 px-3 rounded-xl mb-1 text-sm font-semibold transition ${
                value === opt
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/40"
                  : "text-ink-soft hover:bg-white/[0.05] active:scale-[0.98]"
              }`}
            >
              {opt}
              {value === opt && <span className="text-brand-400 text-base">✓</span>}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-ink-mute text-sm py-8">No results for "{q}"</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tap-to-open picker field ──────────────────────────────────────────────────
function PickerField({
  label,
  placeholder,
  value,
  options,
  searchable,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  searchable?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div>
        <label className="text-xs font-semibold text-ink-soft mb-1.5 block">{label}</label>
        <button
          onClick={() => setOpen(true)}
          className={`w-full input text-left flex items-center justify-between ${
            value ? "text-ink" : "text-ink-mute"
          }`}
        >
          <span>{value || placeholder}</span>
          <span className="text-ink-mute text-xs ml-2">▼</span>
        </button>
      </div>
      {open && (
        <PickerSheet
          label={label}
          options={options}
          value={value}
          onSelect={onChange}
          onClose={() => setOpen(false)}
          searchable={searchable}
        />
      )}
    </>
  );
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);

  // step 0 — college + course
  const [collegePick, setCollegePick] = useState("");
  const [collegeCustom, setCollegeCustom] = useState("");
  const college = collegePick === "Other" ? collegeCustom : collegePick;
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");

  // step 1 — subjects
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  // step 2 — attendance target
  const [target, setTarget] = useState(75);
  const [saving, setSaving] = useState(false);

  function addSubject() {
    const v = subjectInput.trim();
    if (!v || subjects.length >= 12) return;
    setSubjects((s) => [...s, v]);
    setSubjectInput("");
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    const yearNum = parseInt(year) || 1;
    await supabase
      .from("profiles")
      .update({ college: college.trim(), course: course.trim(), year: yearNum })
      .eq("id", user.id);
    if (subjects.length > 0) {
      await supabase.from("subjects").insert(
        subjects.map((name, i) => ({
          user_id: user.id,
          name,
          color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
          target_pct: target,
        }))
      );
    }
    setSaving(false);
    onDone();
  }

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10 animate-fade-in">
      {/* progress */}
      <div className="flex gap-1.5 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i <= step ? "bg-brand-500 flex-1" : "bg-white/10 w-6"}`} />
        ))}
      </div>

      {/* ── Step 0: College + Course ── */}
      {step === 0 && (
        <div className="flex-1 flex flex-col animate-fade-up">
          <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 1 of 3</p>
          <h1 className="text-2xl font-bold text-ink mb-1">Hey {firstName} 👋</h1>
          <p className="text-ink-mute text-[15px] mb-6">Tell us your college so we can connect you with classmates.</p>

          <div className="space-y-4 flex-1">
            <PickerField
              label="College / University"
              placeholder="Select your college"
              value={collegePick}
              options={HYD_COLLEGES}
              searchable
              onChange={setCollegePick}
            />

            {collegePick === "Other" && (
              <div>
                <label className="text-xs font-semibold text-ink-soft mb-1.5 block">College name</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="Type your college name"
                  value={collegeCustom}
                  onChange={(e) => setCollegeCustom(e.target.value)}
                />
              </div>
            )}

            <PickerField
              label="Degree / Course"
              placeholder="Select your course"
              value={course}
              options={COURSES}
              onChange={setCourse}
            />

            <PickerField
              label="Year"
              placeholder="Select your year"
              value={year}
              options={YEARS}
              onChange={setYear}
            />
          </div>

          <div className="pt-6">
            <button
              className="btn-primary w-full"
              disabled={!college.trim() || (collegePick === "Other" && !collegeCustom.trim()) || !course || !year}
              onClick={() => setStep(1)}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Subjects ── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col animate-fade-up">
          <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 2 of 3</p>
          <h1 className="text-2xl font-bold text-ink mb-1">Add your subjects</h1>
          <p className="text-ink-mute text-[15px] mb-6">We&apos;ll track attendance for each one.</p>
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              className="input flex-1"
              placeholder="e.g. DBMS"
              value={subjectInput}
              onChange={(e) => setSubjectInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubject()}
            />
            <button onClick={addSubject} className="w-12 shrink-0 rounded-xl bg-brand-500 text-white flex items-center justify-center active:scale-95 transition">
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {subjects.map((s, i) => (
              <span key={i} className="pill pr-1.5" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] + "22", color: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}>
                {s}
                <button onClick={() => setSubjects((arr) => arr.filter((_, idx) => idx !== i))} className="ml-0.5">
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {subjects.length === 0 && <p className="text-ink-mute text-sm">No subjects yet — add a few.</p>}
          </div>
          <div className="pt-6 space-y-3">
            <button className="btn-primary w-full" onClick={() => setStep(2)}>Continue →</button>
            <button className="w-full text-center text-ink-mute text-sm" onClick={() => setStep(2)}>Skip for now</button>
            <button className="w-full text-center text-ink-mute text-sm" onClick={() => setStep(0)}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Step 2: Attendance Target ── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col animate-fade-up">
          <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 3 of 3</p>
          <h1 className="text-2xl font-bold text-ink mb-1">Attendance target</h1>
          <p className="text-ink-mute text-[15px] mb-8">Most colleges require 75%. We&apos;ll warn you before you cross the line.</p>
          <div className="text-center mb-8">
            <span className="text-6xl font-bold text-brand-500">{target}</span>
            <span className="text-2xl font-bold text-brand-500">%</span>
          </div>
          <input type="range" min={50} max={90} step={5} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-brand-500" />
          <div className="flex justify-between text-xs text-ink-mute mt-2"><span>50%</span><span>90%</span></div>
          <div className="mt-auto pt-6 space-y-3">
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={finish} disabled={saving}>
              {saving ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <CheckIcon className="w-5 h-5" />}
              Start using Footfall 🎉
            </button>
            <button className="w-full text-center text-ink-mute text-sm" onClick={() => setStep(1)}>← Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
