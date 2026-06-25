"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { SUBJECT_COLORS } from "@/lib/types";
import { PlusIcon, XIcon, CheckIcon } from "./icons";

const HYD_COLLEGES = [
  "Adamas University - Kolkata",
  "Adani University - Ahmedabad",
  "AKS University - Satna",
  "Aligarh Muslim University (AMU) - Aligarh",
  "Alliance University - Bengaluru",
  "Amity University - Bengaluru",
  "Amity University - Gurugram",
  "Amity University - Gwalior",
  "Amity University - Jaipur",
  "Amity University - Kolkata",
  "Amity University - Lucknow",
  "Amity University - Mohali",
  "Amity University - Mumbai",
  "Amity University - Noida",
  "Amity University - Patna",
  "Amity University - Raipur",
  "Amity University - Ranchi",
  "Amrita Vishwa Vidyapeetham - Amaravati",
  "Amrita Vishwa Vidyapeetham - Amritapuri",
  "Amrita Vishwa Vidyapeetham - Bengaluru",
  "Amrita Vishwa Vidyapeetham - Chennai",
  "Amrita Vishwa Vidyapeetham - Coimbatore",
  "Amrita Vishwa Vidyapeetham - Kochi",
  "Amrita Vishwa Vidyapeetham - Mysuru",
  "Anant National University - Ahmedabad",
  "Anna University - Guindy Campus",
  "Anna University - MIT Campus",
  "Anurag University - Hyderabad",
  "Apeejay Stya University - Gurugram",
  "Apex Professional University - Pasighat",
  "Arunachal University of Studies - Namsai",
  "Ashoka University - Sonipat",
  "Assam Don Bosco University - Guwahati",
  "Atria University - Bengaluru",
  "Auro University - Surat",
  "Banaras Hindu University (BHU) - Varanasi",
  "Bangalore University - Jnanabharathi Campus",
  "Bennett University - Greater Noida",
  "Bhagwant University - Ajmer",
  "BITS Pilani - Hyderabad Campus",
  "BITS Pilani - K.K. Birla Goa Campus",
  "BITS Pilani - Mumbai Campus",
  "BITS Pilani - Pilani Campus",
  "BML Munjal University - Gurugram",
  "Brainware University - Kolkata",
  "BS Abdur Rahman Crescent Institute of Science and Technology - Chennai",
  "C U Shah University - Surendranagar",
  "C.V. Raman Global University - Bhubaneswar",
  "C.V. Raman University - Bilaspur",
  "Centurion University of Technology and Management - Bhubaneswar",
  "Centurion University of Technology and Management - Paralakhemundi",
  "CGC University - Mohali",
  "Chanakya University - Bengaluru",
  "Chandigarh University (CU) - Mohali",
  "Chitkara University - Himachal Pradesh (Baddi)",
  "Chitkara University - Punjab (Rajpura)",
  "Christ University - Bannerghatta Road (Bengaluru)",
  "Christ University - Central Campus (Bengaluru)",
  "Christ University - Delhi NCR (Ghaziabad)",
  "Christ University - Kengeri (Bengaluru)",
  "Christ University - Pune (Lavasa)",
  "Christ University - Yeshwanthpur (Bengaluru)",
  "CMR University - Bengaluru",
  "Dayananda Sagar University - Bengaluru",
  "Delhi Technological University (DTU) - Rohini",
  "Delhi University - North Campus",
  "Delhi University - South Campus",
  "Dr. K.N. Modi University - Tonk",
  "Flame University - Pune",
  "Galgotias College of Engineering and Technology - Greater Noida",
  "Galgotias University - Greater Noida",
  "GD Goenka University - Gurugram",
  "GITAM - Bengaluru",
  "GITAM - Hyderabad",
  "GITAM - Visakhapatnam",
  "GLA University - Mathura",
  "Graphic Era (Deemed to be University) - Dehradun",
  "Graphic Era Hill University - Bhimtal",
  "Graphic Era Hill University - Dehradun",
  "Graphic Era Hill University - Haldwani",
  "GSFC University - Vadodara",
  "Guru Gobind Singh Indraprastha University (GGSIPU) - Dwarka",
  "Hindustan Institute of Technology and Science - Chennai",
  "ICFAI Foundation for Higher Education - Hyderabad",
  "ICFAI University - Dehradun",
  "ICFAI University - Himachal Pradesh",
  "ICFAI University - Jaipur",
  "ICFAI University - Jharkhand",
  "ICFAI University - Meghalaya",
  "ICFAI University - Mizoram",
  "ICFAI University - Nagaland",
  "ICFAI University - Raipur",
  "ICFAI University - Sikkim",
  "ICFAI University - Tripura",
  "IIMT University - Meerut",
  "Indian Institute of Technology (IIT) - BHU Varanasi",
  "Indian Institute of Technology (IIT) - Bombay",
  "Indian Institute of Technology (IIT) - Delhi",
  "Indian Institute of Technology (IIT) - Guwahati",
  "Indian Institute of Technology (IIT) - Hyderabad",
  "Indian Institute of Technology (IIT) - Indore",
  "Indian Institute of Technology (IIT) - Kanpur",
  "Indian Institute of Technology (IIT) - Kharagpur",
  "Indian Institute of Technology (IIT) - Madras",
  "Indian Institute of Technology (IIT) - Roorkee",
  "Indraprastha Institute of Information Technology (IIIT) - Delhi",
  "Indus University - Ahmedabad",
  "International Institute of Information Technology (IIIT) - Bangalore",
  "International Institute of Information Technology (IIIT) - Hyderabad",
  "Invertis University - Bareilly",
  "ISBM University - Gariyaband",
  "ITM University - Gwalior",
  "ITM Vocational University - Vadodara",
  "Jadavpur University - Kolkata",
  "Jagran Lakecity University - Bhopal",
  "Jain (Deemed-to-be University) - Global Campus (Kanakapura)",
  "Jain (Deemed-to-be University) - Jayanagar (Bengaluru)",
  "Jamia Millia Islamia - New Delhi",
  "Jawaharlal Nehru Technological University (JNTU) - Anantapur",
  "Jawaharlal Nehru Technological University (JNTU) - Hyderabad",
  "Jawaharlal Nehru Technological University (JNTU) - Kakinada",
  "Jawaharlal Nehru University (JNU) - New Delhi",
  "Jayoti Vidyapeeth Women's University - Jaipur",
  "JIS University - Kolkata",
  "JK Lakshmipat University - Jaipur",
  "Kalasalingam Academy of Research and Education - Krishnankoil",
  "Kalinga Institute of Industrial Technology (KIIT) - Bhubaneswar",
  "Kalinga University - Raipur",
  "Karnavati University - Gandhinagar",
  "Karunya Institute of Technology and Sciences - Coimbatore",
  "Kaziranga University - Jorhat",
  "KL Deemed to be University - Hyderabad",
  "KL Deemed to be University - Vijayawada",
  "Krea University - Sri City",
  "LNCT University - Bhopal",
  "Lovely Professional University (LPU) - Phagwara",
  "M.S. Ramaiah University of Applied Sciences - Bengaluru",
  "Madhav University - Sirohi",
  "Maharishi Markandeshwar (Deemed to be University) - Mullana",
  "Mahindra University - Hyderabad",
  "Manav Rachna International Institute of Research and Studies - Faridabad",
  "Manav Rachna University - Faridabad",
  "Mangalayatan University - Aligarh",
  "Manipal Academy of Higher Education (MAHE) - Bengaluru",
  "Manipal Academy of Higher Education (MAHE) - Mangaluru",
  "Manipal Academy of Higher Education (MAHE) - Manipal",
  "Manipal University - Jaipur",
  "Marwadi University - Rajkot",
  "MATS University - Raipur",
  "Medicaps University - Indore",
  "Mewar University - Chittorgarh",
  "Monad University - Hapur",
  "Mumbai University - Kalina Campus",
  "National Institute of Technology (NIT) - Calicut",
  "National Institute of Technology (NIT) - Rourkela",
  "National Institute of Technology (NIT) - Surathkal",
  "National Institute of Technology (NIT) - Trichy",
  "National Institute of Technology (NIT) - Warangal",
  "Navrachana University - Vadodara",
  "Netaji Subhas University of Technology (NSUT) - Dwarka",
  "NIILM University - Kaithal",
  "NIMS University - Jaipur",
  "Nirma University - Ahmedabad",
  "Nitte (Deemed to be University) - Mangaluru",
  "NMIMS - Bengaluru",
  "NMIMS - Chandigarh",
  "NMIMS - Dhule",
  "NMIMS - Hyderabad",
  "NMIMS - Indore",
  "NMIMS - Mumbai",
  "NMIMS - Navi Mumbai",
  "NMIMS - Shirpur",
  "O.P. Jindal Global University - Sonipat",
  "O.P. Jindal University - Raigarh",
  "Osmania University - Hyderabad",
  "P P Savani University - Surat",
  "Pacific University - Udaipur",
  "Panjab University - Chandigarh",
  "Parul University - Vadodara",
  "PES University - Electronic City Campus (Bengaluru)",
  "PES University - Hanumanth Nagar Campus (Bengaluru)",
  "PES University - Ring Road Campus (Bengaluru)",
  "Plaksha University - Mohali",
  "Poornima University - Jaipur",
  "Presidency University - Bengaluru",
  "Pune University (SPPU) - Pune",
  "Rabindranath Tagore University - Bhopal",
  "REVA University - Bengaluru",
  "Rishihood University - Sonipat",
  "RK University - Rajkot",
  "Royal Global University - Guwahati",
  "Sage University - Bhopal",
  "Sage University - Indore",
  "Sangam University - Bhilwara",
  "Sanskriti University - Mathura",
  "SASTRA Deemed University - Thanjavur",
  "Sathyabama Institute of Science and Technology - Chennai",
  "Saveetha Institute of Medical and Technical Sciences - Chennai",
  "Seacom Skills University - Birbhum",
  "Sharda University - Greater Noida",
  "Shiv Nadar Institution of Eminence - Greater Noida",
  "Shiv Nadar University - Chennai",
  "Shobhit University - Meerut",
  "Siksha 'O' Anusandhan (SOA) - Bhubaneswar",
  "Silver Oak University - Ahmedabad",
  "Sister Nivedita University - Kolkata",
  "Sikkim Manipal University - Gangtok",
  "Sri Sri University - Cuttack",
  "SRM Institute of Science and Technology - Kattankulathur",
  "SRM Institute of Science and Technology - Ramapuram",
  "SRM Institute of Science and Technology - Tiruchirappalli",
  "SRM Institute of Science and Technology - Vadapalani",
  "SRM University - AP (Amaravati)",
  "SRM University - Delhi-NCR (Sonepat)",
  "SRM University - Sikkim",
  "Sushant University - Gurugram",
  "Swami Vivekanand Subharti University - Meerut",
  "Swarnim Startup & Innovation University - Gandhinagar",
  "Symbiosis International University - Bengaluru",
  "Symbiosis International University - Hyderabad",
  "Symbiosis International University - Nagpur",
  "Symbiosis International University - Nashik",
  "Symbiosis International University - Noida",
  "Symbiosis International University - Pune (Hinjewadi)",
  "Symbiosis International University - Pune (Khadki)",
  "Symbiosis International University - Pune (Lavale)",
  "Symbiosis International University - Pune (Viman Nagar)",
  "Techno India University - Kolkata",
  "Teerthanker Mahaveer University - Moradabad",
  "Thapar Institute of Engineering and Technology - Dera Bassi",
  "Thapar Institute of Engineering and Technology - Patiala",
  "UEM (University of Engineering & Management) - Jaipur",
  "UEM (University of Engineering & Management) - Kolkata",
  "Uka Tarsadia University - Bardoli",
  "University of Hyderabad - Hyderabad",
  "UPES - Bidholi Campus (Dehradun)",
  "UPES - Kandoli Campus (Dehradun)",
  "Vels Institute of Science, Technology and Advanced Studies - Chennai",
  "Vidyashilp University - Bengaluru",
  "Visvesvaraya Technological University (VTU) - Belagavi",
  "VIT - AP (Amaravati)",
  "VIT - Bhopal",
  "VIT - Chennai",
  "VIT - Vellore",
  "Woxsen University - Hyderabad",
  "Yenepoya (Deemed to be University) - Mangaluru",
  "Other (Please Specify)",
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

  // step 0 — college + course + username
  const [collegePick, setCollegePick] = useState("");
  const [collegeCustom, setCollegeCustom] = useState("");
  const college = collegePick === "Other (Please Specify)" ? collegeCustom : collegePick;
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const checkRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-suggest username from profile name on mount
  useEffect(() => {
    if (profile?.name && !username) {
      const suggested = profile.name
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      setUsername(suggested);
    }
  }, [profile?.name]);

  // Real-time username availability check
  useEffect(() => {
    const v = username.trim();
    if (!v) { setUsernameStatus("idle"); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(v)) { setUsernameStatus("invalid"); return; }
    setUsernameStatus("checking");
    if (checkRef.current) clearTimeout(checkRef.current);
    checkRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", v)
        .neq("id", user?.id ?? "")
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => { if (checkRef.current) clearTimeout(checkRef.current); };
  }, [username, user?.id]);

  // step 1 — subjects
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  // step 2 — attendance target
  const [target, setTarget] = useState(75);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function addSubject() {
    const v = subjectInput.trim();
    if (!v || subjects.length >= 12) return;
    setSubjects((s) => [...s, v]);
    setSubjectInput("");
  }

  async function finish() {
    setSaveError("");
    if (!user) {
      setSaveError("Not signed in — please refresh and try again.");
      return;
    }
    setSaving(true);
    const yearNum = parseInt(year) || 1;
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ college: college.trim(), course: course.trim(), year: yearNum, username: username.trim() || null })
      .eq("id", user.id);
    if (profErr) {
      setSaveError(`Profile save failed: ${profErr.message}`);
      setSaving(false);
      return;
    }
    if (subjects.length > 0) {
      const { error: subErr } = await supabase.from("subjects").insert(
        subjects.map((name, i) => ({
          user_id: user.id,
          name,
          color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
          target_pct: target,
        }))
      );
      if (subErr) {
        setSaveError(`Subjects save failed: ${subErr.message}`);
        setSaving(false);
        return;
      }
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

            {collegePick === "Other (Please Specify)" && (
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

            {/* Username */}
            <div>
              <label className="text-xs font-semibold text-ink-soft mb-1.5 block">Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute font-bold text-sm select-none">@</span>
                <input
                  className="input pl-7 pr-10"
                  placeholder="your_handle"
                  value={username}
                  maxLength={20}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {usernameStatus === "checking" && <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" />}
                  {usernameStatus === "available" && <span className="text-brand-400 font-bold">✓</span>}
                  {usernameStatus === "taken" && <span className="text-red-400 font-bold">✗</span>}
                  {usernameStatus === "invalid" && <span className="text-amber-400 font-bold">!</span>}
                </span>
              </div>
              <p className={`text-[11px] mt-1.5 font-medium ${
                usernameStatus === "available" ? "text-brand-400" :
                usernameStatus === "taken" ? "text-red-400" :
                usernameStatus === "invalid" ? "text-amber-400" :
                "text-ink-mute"
              }`}>
                {usernameStatus === "available" && "@" + username + " is available"}
                {usernameStatus === "taken" && "That username is taken — try another"}
                {usernameStatus === "invalid" && "3–20 chars, lowercase letters, numbers, underscores only"}
                {(usernameStatus === "idle" || usernameStatus === "checking") && "3–20 chars · letters, numbers, underscores"}
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              className="btn-primary w-full"
              disabled={
                !college.trim() ||
                (collegePick === "Other (Please Specify)" && !collegeCustom.trim()) ||
                !course ||
                !year ||
                usernameStatus !== "available"
              }
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
            {saveError && <p className="text-red-400 text-sm text-center">{saveError}</p>}
            <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={finish} disabled={saving}>
              {saving ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <CheckIcon className="w-5 h-5" />}
              Start using Cmpus 🎉
            </button>
            <button className="w-full text-center text-ink-mute text-sm" onClick={() => setStep(1)}>← Back</button>
          </div>
        </div>
      )}
    </div>
  );
}
