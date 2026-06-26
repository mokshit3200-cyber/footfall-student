"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ClassSlot, DayKey, SUBJECT_COLORS, Subject } from "@/lib/types";
import { dbSaveTimetableSlot } from "@/lib/dbActions";
import { useStore } from "./store";
import { PlusIcon, XIcon, CheckIcon } from "./icons";
import { isValidImageFile, sanitizeHandle, sanitizeText } from "@/lib/validation";

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

// â”€â”€ Reusable bottom-sheet picker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              {value === opt && <span className="text-brand-400 text-base">âœ“</span>}
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

// â”€â”€ Tap-to-open picker field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <span className="text-ink-mute text-xs ml-2">â–¼</span>
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

// â”€â”€ Main Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SKILL_SUGGESTIONS = [
  "UI Design", "Python", "JavaScript", "Machine Learning", "Graphic Design",
  "Video Editing", "Content Writing", "Photography", "Flutter", "Data Science",
  "Public Speaking", "Finance", "Marketing", "Music", "Gaming",
];
const DAY_KEYS_ONBOARDING: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS_ONBOARDING: Record<DayKey, string> = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function makeId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { user, profile } = useAuth();
  const { update } = useStore();
  const [step, setStep] = useState(0);
  const [collegePick, setCollegePick] = useState("");
  const [collegeCustom, setCollegeCustom] = useState("");
  const college = collegePick === "Other (Please Specify)" ? collegeCustom : collegePick;
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const checkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const checkCountRef = useRef(0);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [bio, setBio] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [phase, setPhase] = useState<"subjects" | "slots">("subjects");
  const [activeDay, setActiveDay] = useState<DayKey>("mon");
  const [slotSubjectId, setSlotSubjectId] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [slots, setSlots] = useState<ClassSlot[]>([]);

  const [target, setTarget] = useState(75);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (profile?.name && !username) {
      const suggested = profile.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 20);
      setUsername(suggested);
    }
  }, [profile?.name]);

  useEffect(() => {
    const v = username.trim();
    if (!v) { setUsernameStatus("idle"); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(v)) { setUsernameStatus("invalid"); return; }
    checkCountRef.current++;
    if (checkCountRef.current > 30) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    if (checkRef.current) clearTimeout(checkRef.current);
    checkRef.current = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", v).neq("id", user?.id ?? "").maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => { if (checkRef.current) clearTimeout(checkRef.current); };
  }, [username, user?.id]);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const initials = (profile?.name || "Student").trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const identityValid = !!college.trim() && !!course && !!year && usernameStatus === "available";
  const profileValid = bio.trim().length > 0 && skills.length >= 1;
  const availableSuggestions = SKILL_SUGGESTIONS.filter((s) => !skills.includes(s));
  const slotsForDay = slots.filter((s) => s.day === activeDay).sort((a, b) => a.start.localeCompare(b.start));

  async function uploadAvatar(file: File) {
    if (!user) return;
    setAvatarUploading(true);
    setProfileSaveError("");
    if (!isValidImageFile(file, 5)) {
      setProfileSaveError("Please upload an image under 5MB");
      setAvatarUploading(false);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    const path = `${user.id}/avatar.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) { setProfileSaveError(`Photo upload failed: ${error.message}`); setAvatarUploading(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    setAvatarUrl(publicUrl);
    setAvatarPreview(publicUrl);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    setAvatarUploading(false);
  }

  function addSkill(raw = skillInput) {
    const v = raw.trim();
    if (!v || skills.length >= 10 || skills.some((s) => s.toLowerCase() === v.toLowerCase())) return;
    setSkills((arr) => [...arr, v]);
    setSkillInput("");
  }

  async function saveProfileStep() {
    if (!user || !profileValid) return;
    setProfileSaving(true);
    setProfileSaveError("");
    const cleanBio = sanitizeText(bio, 120);
    const cleanSkills = skills.map((s) => sanitizeText(s, 40)).filter(Boolean).slice(0, 10);
    const links = { instagram: sanitizeHandle(instagram.replace(/^@+/, "")), linkedin: sanitizeHandle(linkedin.replace(/https?:\/\/[^/]+\/in\//i, "")) };
    const { error } = await supabase.from("profiles").update({ bio: cleanBio, skills: cleanSkills, links }).eq("id", user.id);
    setProfileSaving(false);
    if (error) { setProfileSaveError(`Profile save failed: ${error.message}`); return; }
    update((d) => { d.profile.bio = cleanBio; d.profile.skills = cleanSkills; d.profile.links = links; if (avatarUrl) d.profile.avatar = avatarUrl; });
    setStep(2);
  }

  function addSubject() {
    const v = subjectInput.trim();
    if (!v || subjects.length >= 12 || subjects.some((s) => s.name.toLowerCase() === v.toLowerCase())) return;
    setSubjects((arr) => [...arr, { id: makeId(), name: v, color: SUBJECT_COLORS[arr.length % SUBJECT_COLORS.length] }]);
    setSubjectInput("");
  }

  function removeSubject(id: string) {
    setSubjects((arr) => arr.filter((s) => s.id !== id));
    setSlots((arr) => arr.filter((slot) => slot.subjectId !== id));
    if (slotSubjectId === id) setSlotSubjectId(null);
  }

  function addSlot() {
    if (!slotSubjectId || !slotStart || !slotEnd) return;
    setSlots((arr) => [...arr, { id: makeId(), day: activeDay, subjectId: slotSubjectId, start: slotStart, end: slotEnd }]);
    setSlotSubjectId(null);
  }

  async function finish() {
    setSaveError("");
    if (!user) { setSaveError("Not signed in - please refresh and try again."); return; }
    setSaving(true);
    const yearNum = parseInt(year) || 1;
    const cleanBio = sanitizeText(bio, 120);
    const cleanSkills = skills.map((s) => sanitizeText(s, 40)).filter(Boolean).slice(0, 10);
    const links = { instagram: sanitizeHandle(instagram.replace(/^@+/, "")), linkedin: sanitizeHandle(linkedin.replace(/https?:\/\/[^/]+\/in\//i, "")) };
    const { error: profErr } = await supabase.from("profiles").update({ college: sanitizeText(college, 120), course: sanitizeText(course, 80), year: yearNum, username: username.trim() || null, bio: cleanBio, skills: cleanSkills, links, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }).eq("id", user.id);
    if (profErr) { setSaveError(`Profile save failed: ${profErr.message}`); setSaving(false); return; }
    if (subjects.length > 0) {
      const { error: subErr } = await supabase.from("subjects").insert(subjects.map((subject) => ({ user_id: user.id, name: subject.name, color: subject.color, target_pct: target })));
      if (subErr) { setSaveError(`Subjects save failed: ${subErr.message}`); setSaving(false); return; }
    }
    for (const slot of slots) {
      const subjectName = subjects.find((s) => s.id === slot.subjectId)?.name ?? slot.subjectId;
      await dbSaveTimetableSlot(user.id, slot, subjectName);
    }
    update((d) => {
      d.profile.college = sanitizeText(college, 120); d.profile.course = sanitizeText(course, 80); d.profile.year = yearNum; d.profile.attendanceTarget = target / 100;
      d.profile.bio = cleanBio; d.profile.skills = cleanSkills; d.profile.links = links; if (avatarUrl) d.profile.avatar = avatarUrl;
      d.subjects = [...subjects]; d.timetable = [...slots];
    });
    setSaving(false);
    onDone();
  }

  const progress = (
    <div className="mb-8">
      <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-3">Step {step + 1} of 4</p>
      <div className="flex items-center gap-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "bg-brand-500 flex-1" : i < step ? "bg-brand-500/70 w-8" : "bg-white/10 w-6"}`} />)}</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10 animate-fade-in bg-black">
      {progress}
      {step === 0 && (
        <div className="flex-1 flex flex-col animate-fade-up">
          <h1 className="text-2xl font-bold text-ink mb-1">Hey {firstName}</h1>
          <p className="text-ink-mute text-[15px] mb-6">Tell us who you are so Cmpus feels like your campus from day one.</p>
          <div className="space-y-4 flex-1">
            <div><label className="text-xs font-semibold text-ink-soft mb-1.5 block">Username</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-mute font-bold text-sm select-none">@</span><input className="input pl-7 pr-10" placeholder="your_handle" value={username} maxLength={20} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} autoCapitalize="none" autoCorrect="off" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{usernameStatus === "checking" && <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" />}{usernameStatus === "available" && <span className="text-brand-400 font-bold">?</span>}{usernameStatus === "taken" && <span className="text-red-400 font-bold">×</span>}{usernameStatus === "invalid" && <span className="text-amber-400 font-bold">!</span>}</span></div><p className={`text-[11px] mt-1.5 font-medium ${usernameStatus === "available" ? "text-brand-400" : usernameStatus === "taken" ? "text-red-400" : usernameStatus === "invalid" ? "text-amber-400" : "text-ink-mute"}`}>{usernameStatus === "available" && "@" + username + " is available"}{usernameStatus === "taken" && "That username is taken - try another"}{usernameStatus === "invalid" && "3-20 chars, lowercase letters, numbers, underscores only"}{(usernameStatus === "idle" || usernameStatus === "checking") && "3-20 chars · letters, numbers, underscores"}</p></div>
            <PickerField label="College / University" placeholder="Select your college" value={collegePick} options={HYD_COLLEGES} searchable onChange={setCollegePick} />
            {collegePick === "Other (Please Specify)" && <div><label className="text-xs font-semibold text-ink-soft mb-1.5 block">College name</label><input autoFocus className="input" placeholder="Type your college name" value={collegeCustom} onChange={(e) => setCollegeCustom(e.target.value)} /></div>}
            <PickerField label="Degree / Course" placeholder="Select your course" value={course} options={COURSES} onChange={setCourse} />
            <div><label className="text-xs font-semibold text-ink-soft mb-2 block">Year</label><div className="grid grid-cols-2 gap-2">{YEARS.slice(0, 4).map((y) => <button key={y} type="button" onClick={() => setYear(y)} className={`h-11 rounded-xl text-sm font-bold active:scale-[0.97] transition-all ${year === y ? "bg-brand-500 text-white" : "bg-white/[0.05] text-ink-soft border border-white/[0.08]"}`}>{y}</button>)}</div></div>
          </div>
          <div className="pt-6"><button className="btn-primary w-full active:scale-[0.97] transition-all" disabled={!identityValid} onClick={() => setStep(1)}>Continue ?</button></div>
        </div>
      )}
      {step === 1 && (
        <div className="flex-1 flex flex-col animate-fade-up"><h1 className="text-2xl font-bold text-ink mb-1">Build your profile</h1><p className="text-ink-mute text-[15px] mb-6">A little context helps classmates know when to reach out.</p><div className="flex-1 space-y-5"><div className="flex flex-col items-center"><button type="button" onClick={() => avatarInputRef.current?.click()} className="relative w-24 h-24 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center overflow-visible active:scale-[0.97] transition-all">{avatarPreview ? <img src={avatarPreview} alt="Profile preview" className="w-full h-full rounded-full object-cover" /> : <span className="text-2xl font-black text-white">{initials}</span>}<span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-500 text-white border-4 border-black flex items-center justify-center text-sm">??</span></button><input ref={avatarInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAvatar(file); }} /><button type="button" onClick={() => avatarInputRef.current?.click()} className="mt-3 text-xs text-ink-mute hover:text-ink-soft active:scale-[0.97] transition-all">{avatarUploading ? "Uploading photo..." : "Skip photo ?"}</button></div><div><label className="text-xs font-semibold text-ink-soft mb-1.5 block">Bio</label><div className="relative"><textarea className="input min-h-[88px] resize-none pb-7" rows={3} maxLength={120} placeholder="Final year CSE student. Chai > Coffee ? | Open to collabs" value={bio} onChange={(e) => setBio(e.target.value)} /><span className="absolute right-3 bottom-2 text-[10px] text-ink-mute">{bio.length}/120</span></div></div><div><label className="text-xs font-semibold text-ink-soft mb-1.5 block">Your skills</label><div className="flex gap-2 mb-3"><input className="input flex-1" placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill()} /><button type="button" onClick={() => addSkill()} disabled={skills.length >= 10} className="w-12 shrink-0 rounded-xl bg-brand-500 text-white flex items-center justify-center active:scale-[0.97] transition-all disabled:opacity-40"><PlusIcon className="w-5 h-5" /></button></div><div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">{skills.map((skill) => <span key={skill} className="pill pr-1.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 animate-scale-in">{skill}<button type="button" onClick={() => setSkills((arr) => arr.filter((s) => s !== skill))} className="ml-1 active:scale-[0.97] transition-all"><XIcon className="w-3.5 h-3.5" /></button></span>)}</div><div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{availableSuggestions.map((skill) => <button key={skill} type="button" onClick={() => addSkill(skill)} className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-ink-soft active:scale-[0.97] transition-all">{skill}</button>)}</div></div><div className="space-y-3"><label className="text-xs font-semibold text-ink-soft block">Social links</label><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2">??</span><input className="input pl-10" placeholder="@your_handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} /></div><div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2">??</span><input className="input pl-10" placeholder="linkedin.com/in/yourname" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div></div></div><div className="pt-6 space-y-3">{profileSaveError && <p className="text-red-400 text-sm text-center">{profileSaveError}</p>}<button className="btn-primary w-full active:scale-[0.97] transition-all" onClick={saveProfileStep} disabled={!profileValid || profileSaving || avatarUploading}>{profileSaving ? "Saving..." : "Continue ?"}</button><button className="w-full text-center text-ink-mute text-sm active:scale-[0.97] transition-all" onClick={() => setStep(0)}>? Back</button></div></div>
      )}
      {step === 2 && <TimetableOnboarding phase={phase} setPhase={setPhase} subjectInput={subjectInput} setSubjectInput={setSubjectInput} subjects={subjects} addSubject={addSubject} removeSubject={removeSubject} activeDay={activeDay} setActiveDay={setActiveDay} slotsForDay={slotsForDay} slots={slots} setSlots={setSlots} slotSubjectId={slotSubjectId} setSlotSubjectId={setSlotSubjectId} slotStart={slotStart} setSlotStart={setSlotStart} slotEnd={slotEnd} setSlotEnd={setSlotEnd} addSlot={addSlot} onBack={() => setStep(1)} onDone={() => setStep(3)} />}
      {step === 3 && <div className="flex-1 flex flex-col animate-fade-up"><h1 className="text-2xl font-bold text-ink mb-1">Attendance target</h1><p className="text-ink-mute text-[15px] mb-8">Most colleges require 75%. We&apos;ll warn you before you cross the line.</p><div className="text-center mb-8"><span className="text-6xl font-bold text-brand-500">{target}</span><span className="text-2xl font-bold text-brand-500">%</span></div><input type="range" min={50} max={90} step={5} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-brand-500" /><div className="flex justify-between text-xs text-ink-mute mt-2"><span>50%</span><span>90%</span></div><div className="mt-auto pt-6 space-y-3">{saveError && <p className="text-red-400 text-sm text-center">{saveError}</p>}<button className="btn-primary w-full flex items-center justify-center gap-2 active:scale-[0.97] transition-all" onClick={finish} disabled={saving}>{saving ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : <CheckIcon className="w-5 h-5" />}Start using Cmpus ??</button><button className="w-full text-center text-ink-mute text-sm active:scale-[0.97] transition-all" onClick={() => setStep(2)}>? Back</button></div></div>}
    </div>
  );
}

function TimetableOnboarding({ phase, setPhase, subjectInput, setSubjectInput, subjects, addSubject, removeSubject, activeDay, setActiveDay, slotsForDay, slots, setSlots, slotSubjectId, setSlotSubjectId, slotStart, setSlotStart, slotEnd, setSlotEnd, addSlot, onBack, onDone }: any) {
  return <div className="flex-1 flex flex-col animate-fade-up">{phase === "subjects" ? <><h1 className="text-2xl font-bold text-ink mb-1">What subjects do you have this semester?</h1><p className="text-ink-mute text-[15px] mb-6">Add at least 4. You can always add more later.</p><div className="flex gap-2 mb-4"><input autoFocus className="input flex-1" placeholder="e.g. DBMS" value={subjectInput} onChange={(e) => setSubjectInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} /><button type="button" onClick={addSubject} className="w-12 shrink-0 rounded-xl bg-brand-500 text-white flex items-center justify-center active:scale-[0.97] transition-all"><PlusIcon className="w-5 h-5" /></button></div><p className={`text-xs font-bold mb-3 ${subjects.length >= 4 ? "text-brand-400" : "text-ink-mute"}`}>{subjects.length} subjects added</p><div className="flex flex-wrap gap-2 flex-1 content-start">{subjects.map((subject: Subject) => <span key={subject.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs font-bold text-ink-soft animate-scale-in"><span className="w-2 h-2 rounded-full" style={{ background: subject.color }} />{subject.name}<button type="button" onClick={() => removeSubject(subject.id)} className="active:scale-[0.97] transition-all"><XIcon className="w-3.5 h-3.5" /></button></span>)}</div><div className="pt-6 space-y-3"><button className="btn-primary w-full active:scale-[0.97] transition-all" disabled={subjects.length < 4} onClick={() => setPhase("slots")}>Build my timetable ?</button><button className="w-full text-center text-ink-mute text-sm active:scale-[0.97] transition-all" onClick={onBack}>? Back</button></div></> : <><button type="button" onClick={() => setPhase("subjects")} className="self-start text-xs text-ink-mute hover:text-ink-soft mb-4 active:scale-[0.97] transition-all">? Change subjects</button><h1 className="text-2xl font-bold text-ink mb-1">When do you have classes?</h1><p className="text-ink-mute text-[15px] mb-5">Tap a subject under each day to add it.</p><div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">{DAY_KEYS_ONBOARDING.map((day) => <button key={day} type="button" onClick={() => setActiveDay(day)} className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold active:scale-[0.97] transition-all ${activeDay === day ? "bg-brand-500 text-white" : "text-ink-mute"}`}>{DAY_LABELS_ONBOARDING[day]}</button>)}</div><div className="space-y-2 mb-5 min-h-[74px]">{slotsForDay.length === 0 ? <p className="text-ink-mute text-sm py-4 text-center bg-white/[0.03] rounded-2xl border border-white/[0.06]">No classes yet</p> : slotsForDay.map((slot: ClassSlot) => { const subject = subjects.find((s: Subject) => s.id === slot.subjectId); return <div key={slot.id} className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl p-3"><span className="w-2 h-2 rounded-full" style={{ background: subject?.color || "#999" }} /><span className="text-sm font-semibold text-ink flex-1">{subject?.name || "Subject"}</span><span className="text-xs text-ink-mute tabular-nums">{slot.start} - {slot.end}</span><button type="button" onClick={() => setSlots((arr: ClassSlot[]) => arr.filter((s) => s.id !== slot.id))} className="text-ink-mute active:scale-[0.97] transition-all"><XIcon className="w-4 h-4" /></button></div>; })}</div><div className="space-y-2 flex-1">{subjects.map((subject: Subject) => <div key={subject.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden"><button type="button" onClick={() => setSlotSubjectId(slotSubjectId === subject.id ? null : subject.id)} className="w-full p-3 flex items-center gap-2.5 text-left active:scale-[0.99] transition-all"><span className="w-2.5 h-2.5 rounded-full" style={{ background: subject.color }} /><span className="text-sm font-bold text-ink flex-1">{subject.name}</span><span className="text-xs text-ink-mute">Tap to add</span></button>{slotSubjectId === subject.id && <div className="px-3 pb-3 flex gap-2"><input type="time" className="input flex-1" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} /><input type="time" className="input flex-1" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} /><button type="button" onClick={addSlot} className="px-3 rounded-xl bg-brand-500 text-white text-xs font-bold active:scale-[0.97] transition-all">Add slot</button></div>}</div>)}</div><div className="pt-6"><button className="btn-primary w-full active:scale-[0.97] transition-all" disabled={slots.length === 0} onClick={onDone}>Done - let's go! ??</button></div></>}</div>;
}
