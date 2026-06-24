"use client";

import { useMemo, useState } from "react";
import { SearchIcon, XIcon, ClockIcon } from "./icons";

interface Facility {
  name: string;
  category: "lab" | "food" | "admin" | "hostel" | "sports" | "other";
  floor: string;
  details: string;
  walkTimeFromGate: number; // minutes
}

interface BlockData {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  colorHex: string;
  facilities: Facility[];
}

const CAMPUS_BLOCKS: BlockData[] = [
  {
    id: "A",
    name: "Block A (Academic)",
    emoji: "🏫",
    description: "Main lecture halls, Computer Science department, and seminar rooms.",
    color: "brand",
    colorHex: "#7c3aed",
    facilities: [
      { name: "Computer Lab 1 (CS Dept)", category: "lab", floor: "1st Floor", details: "DBMS, Networks, and Operating Systems lab sessions.", walkTimeFromGate: 3 },
      { name: "Computer Lab 2 (Web Dev)", category: "lab", floor: "1st Floor", details: "Web engineering and graphics laboratory.", walkTimeFromGate: 3 },
      { name: "Electronics & IoT Lab", category: "lab", floor: "Ground Floor", details: "Microprocessors, IoT prototyping and hardware kits.", walkTimeFromGate: 3 },
      { name: "Seminar Hall 1", category: "other", floor: "2nd Floor", details: "150-seater air-conditioned hall for hackathons and guest lectures.", walkTimeFromGate: 4 },
      { name: "CS Department Office", category: "admin", floor: "2nd Floor", details: "Course registration, timetables, and academic queries.", walkTimeFromGate: 4 },
      { name: "Physics Lecture Room 104", category: "other", floor: "Ground Floor", details: "Main classroom for freshman Physics lectures.", walkTimeFromGate: 3 },
    ],
  },
  {
    id: "B",
    name: "Block B (Library & Labs)",
    emoji: "📚",
    description: "Central Library, science laboratories, and administrative offices.",
    color: "blue",
    colorHex: "#3b82f6",
    facilities: [
      { name: "Central Library", category: "other", floor: "1st & 2nd Floor", details: "Quiet study zones, research journals, reference books, and e-library access.", walkTimeFromGate: 2 },
      { name: "Chemistry Lab", category: "lab", floor: "Ground Floor", details: "Organic and inorganic chemistry experiments.", walkTimeFromGate: 2 },
      { name: "Physics Research Lab", category: "lab", floor: "Ground Floor", details: "Optics, mechanics and quantum physics experimental apparatus.", walkTimeFromGate: 2 },
      { name: "Registrar Office", category: "admin", floor: "Ground Floor", details: "Admissions, official transcripts, and fees desk.", walkTimeFromGate: 2 },
      { name: "Placement & Internship Cell", category: "admin", floor: "3rd Floor", details: "Recruitment drives, resume reviews, and career counseling.", walkTimeFromGate: 3 },
    ],
  },
  {
    id: "Hub",
    name: "Student Hub (Canteen)",
    emoji: "🍔",
    description: "Recreational zone, food courts, and campus shops.",
    color: "amber",
    colorHex: "#f59e0b",
    facilities: [
      { name: "Main Cafeteria", category: "food", floor: "Ground Floor", details: "Lunch meals, snacks, samosas, and regional dishes. Open 8 AM - 8 PM.", walkTimeFromGate: 3 },
      { name: "Nescafe Kiosk", category: "food", floor: "Ground Floor", details: "Frappes, hot coffees, iced tea, and quick bites. Student favorite hangout.", walkTimeFromGate: 3 },
      { name: "Stationary & Print Shop", category: "other", floor: "Ground Floor", details: "Photocopies, lab notebooks, assignment printing, and supplies.", walkTimeFromGate: 4 },
      { name: "Indoor Games Arena", category: "sports", floor: "1st Floor", details: "Table tennis tables, billiard tables, chess, and carrom boards.", walkTimeFromGate: 4 },
      { name: "Campus Gym", category: "sports", floor: "1st Floor", details: "Cardio machines, free weights, and crossfit training setup.", walkTimeFromGate: 4 },
    ],
  },
  {
    id: "Hostels",
    name: "Hostel Blocks",
    emoji: "🏠",
    description: "On-campus residential housing and dining facilities.",
    color: "pink",
    colorHex: "#ec4899",
    facilities: [
      { name: "Boys Hostel 1 (BH1)", category: "hostel", floor: "4 Floors", details: "Freshmen and sophomore boys residency. Wi-Fi enabled common room.", walkTimeFromGate: 6 },
      { name: "Boys Hostel 2 (BH2)", category: "hostel", floor: "4 Floors", details: "Senior boys residency. Single-seater rooms and study hall.", walkTimeFromGate: 7 },
      { name: "Girls Hostel 1 (GH1)", category: "hostel", floor: "3 Floors", details: "All-year girls residency. Strict security, garden courtyard.", walkTimeFromGate: 5 },
      { name: "Dining Mess Block", category: "food", floor: "Ground Floor", details: "Serves daily breakfast, lunch, tea, and dinner. Closed between meals.", walkTimeFromGate: 6 },
    ],
  },
  {
    id: "Sports",
    name: "Sports & Grounds",
    emoji: "⚽",
    description: "Outdoor sporting fields and courts.",
    color: "teal",
    colorHex: "#14b8a6",
    facilities: [
      { name: "Main Football Field", category: "sports", floor: "Outdoor", details: "Full-size grass pitch. Venue for inter-college leagues.", walkTimeFromGate: 5 },
      { name: "Basketball Court", category: "sports", floor: "Outdoor", details: "Floodlit concrete court. Open for evening matches.", walkTimeFromGate: 4 },
      { name: "Volleyball Court", category: "sports", floor: "Outdoor", details: "Sand volleyball court behind the Student Hub.", walkTimeFromGate: 4 },
      { name: "Badminton Arena", category: "sports", floor: "Indoor Block", details: "Two wooden indoor courts. Booking required.", walkTimeFromGate: 5 },
    ],
  },
];

const HUB_DISTANCES = [
  { from: "Hostels", to: "Student Hub", time: 2, icon: "🍔" },
  { from: "Student Hub", to: "Block A", time: 3, icon: "🏫" },
  { from: "Block A", to: "Block B", time: 1, icon: "📚" },
  { from: "Hostels", to: "Block B", time: 4, icon: "📚" },
  { from: "Block A", to: "Sports & Grounds", time: 2, icon: "⚽" },
];

export default function CampusMap() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"map" | "directory" | "times">("map");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  const blockMap = useMemo(() => {
    return Object.fromEntries(CAMPUS_BLOCKS.map((b) => [b.id, b]));
  }, []);

  const allFacilities = useMemo(() => {
    const list: (Facility & { blockName: string; blockId: string; blockColor: string })[] = [];
    CAMPUS_BLOCKS.forEach((b) => {
      b.facilities.forEach((f) => {
        list.push({
          ...f,
          blockName: b.name,
          blockId: b.id,
          blockColor: b.colorHex,
        });
      });
    });
    return list;
  }, []);

  const filteredFacilities = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allFacilities.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(q) ||
        f.details.toLowerCase().includes(q) ||
        f.blockName.toLowerCase().includes(q);
      const matchCat = filterCat === "all" || f.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [allFacilities, search, filterCat]);

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Sub tabs */}
      <div className="flex bg-[#0e0e11] border border-white/[0.08] p-1 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab("map");
            setSelectedBlock(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "map" ? "bg-white/[0.08] text-white" : "text-ink-soft hover:text-white"
          }`}
        >
          📍 Interactive Map
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "directory" ? "bg-white/[0.08] text-white" : "text-ink-soft hover:text-white"
          }`}
        >
          📁 Directory List
        </button>
        <button
          onClick={() => setActiveTab("times")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "times" ? "bg-white/[0.08] text-white" : "text-ink-soft hover:text-white"
          }`}
        >
          ⏱️ Walking Times
        </button>
      </div>

      {/* 1. INTERACTIVE MAP VIEW */}
      {activeTab === "map" && (
        <div className="space-y-4">
          <div className="relative card p-3 bg-black/40 overflow-hidden select-none">
            {/* Pulsing indicator guides */}
            <p className="text-[11px] text-ink-mute font-bold mb-2 text-center uppercase tracking-wider">
              Tap any block on the map to explore facilities
            </p>

            <svg viewBox="0 0 400 260" className="w-full h-auto bg-black/[0.2] border border-white/5 rounded-2xl">
              <defs>
                <linearGradient id="grad-A" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="grad-B" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="grad-Hub" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="grad-Hostels" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="grad-Sports" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.05" />
                </linearGradient>

                {/* SVG Filter for Glow Effect */}
                <filter id="glow-A" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Pathways / Roads */}
              <path d="M200,0 L200,260 M0,120 L400,120 M80,120 L80,260" stroke="rgba(255,255,255,0.04)" strokeWidth="12" strokeLinecap="round" fill="none" />

              {/* Gate Entry Label */}
              <text x="200" y="250" fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="bold" textAnchor="middle">
                ⬇️ MAIN GATE ENTRY
              </text>

              {/* Block A (Academic Block) */}
              <g className="cursor-pointer group" onClick={() => setSelectedBlock("A")}>
                <rect
                  x="20"
                  y="20"
                  width="100"
                  height="80"
                  rx="16"
                  fill="url(#grad-A)"
                  stroke={selectedBlock === "A" ? "#a472f2" : "#7c3aed"}
                  strokeWidth={selectedBlock === "A" ? 2.5 : 1.5}
                  style={{
                    filter: selectedBlock === "A" ? "drop-shadow(0 0 8px rgba(124,58,237,0.45))" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <text x="70" y="55" fill="#f4f4f5" fontSize="13" fontWeight="black" textAnchor="middle">
                  BLOCK A
                </text>
                <text x="70" y="75" fill="#c4a7f9" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  Academic 🏫
                </text>
              </g>

              {/* Block B (Library & Labs) */}
              <g className="cursor-pointer group" onClick={() => setSelectedBlock("B")}>
                <rect
                  x="140"
                  y="20"
                  width="110"
                  height="80"
                  rx="16"
                  fill="url(#grad-B)"
                  stroke={selectedBlock === "B" ? "#60a5fa" : "#3b82f6"}
                  strokeWidth={selectedBlock === "B" ? 2.5 : 1.5}
                  style={{
                    filter: selectedBlock === "B" ? "drop-shadow(0 0 8px rgba(59,130,246,0.45))" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <text x="195" y="55" fill="#f4f4f5" fontSize="13" fontWeight="black" textAnchor="middle">
                  BLOCK B
                </text>
                <text x="195" y="75" fill="#93c5fd" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  Library/Labs 📚
                </text>
              </g>

              {/* Student Hub */}
              <g className="cursor-pointer group" onClick={() => setSelectedBlock("Hub")}>
                <rect
                  x="270"
                  y="20"
                  width="110"
                  height="80"
                  rx="16"
                  fill="url(#grad-Hub)"
                  stroke={selectedBlock === "Hub" ? "#fbbf24" : "#f59e0b"}
                  strokeWidth={selectedBlock === "Hub" ? 2.5 : 1.5}
                  style={{
                    filter: selectedBlock === "Hub" ? "drop-shadow(0 0 8px rgba(245,158,11,0.45))" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <text x="325" y="55" fill="#f4f4f5" fontSize="12" fontWeight="black" textAnchor="middle">
                  STUDENT HUB
                </text>
                <text x="325" y="75" fill="#fde047" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  Canteen 🍔
                </text>
              </g>

              {/* Hostels */}
              <g className="cursor-pointer group" onClick={() => setSelectedBlock("Hostels")}>
                <rect
                  x="20"
                  y="130"
                  width="150"
                  height="85"
                  rx="16"
                  fill="url(#grad-Hostels)"
                  stroke={selectedBlock === "Hostels" ? "#f472b6" : "#ec4899"}
                  strokeWidth={selectedBlock === "Hostels" ? 2.5 : 1.5}
                  style={{
                    filter: selectedBlock === "Hostels" ? "drop-shadow(0 0 8px rgba(236,72,153,0.45))" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <text x="95" y="165" fill="#f4f4f5" fontSize="13" fontWeight="black" textAnchor="middle">
                  HOSTELS
                </text>
                <text x="95" y="185" fill="#fbcfe8" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  BH1 / GH1 / Mess 🏠
                </text>
              </g>

              {/* Sports Ground */}
              <g className="cursor-pointer group" onClick={() => setSelectedBlock("Sports")}>
                <rect
                  x="190"
                  y="130"
                  width="190"
                  height="85"
                  rx="16"
                  fill="url(#grad-Sports)"
                  stroke={selectedBlock === "Sports" ? "#2dd4bf" : "#14b8a6"}
                  strokeWidth={selectedBlock === "Sports" ? 2.5 : 1.5}
                  style={{
                    filter: selectedBlock === "Sports" ? "drop-shadow(0 0 8px rgba(20,184,166,0.45))" : "none",
                    transition: "all 0.3s ease",
                  }}
                />
                <text x="285" y="165" fill="#f4f4f5" fontSize="13" fontWeight="black" textAnchor="middle">
                  SPORTS AREA
                </text>
                <text x="285" y="185" fill="#99f6e4" fontSize="9.5" fontWeight="bold" textAnchor="middle">
                  Football/Courts ⚽
                </text>
              </g>
            </svg>
          </div>

          {/* Block Info Panel */}
          {selectedBlock ? (
            <div className="card p-4 border border-white/[0.08] bg-[#0c0c0e]/95 relative animate-fade-up">
              <button
                onClick={() => setSelectedBlock(null)}
                className="absolute top-3 right-3 text-ink-mute hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-2xl">{blockMap[selectedBlock].emoji}</span>
                <div>
                  <h4 className="text-sm font-black text-ink leading-tight">
                    {blockMap[selectedBlock].name}
                  </h4>
                  <p className="text-[11px] text-ink-soft mt-0.5">
                    {blockMap[selectedBlock].description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2.5">
                <p className="text-[11.5px] font-black text-brand-300 uppercase tracking-wide">
                  Facilities Inside Block
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
                  {blockMap[selectedBlock].facilities.map((fac, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11.5px] font-bold text-ink truncate">
                            {fac.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[9.5px] font-bold text-ink-soft shrink-0">
                            {fac.floor}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-mute mt-0.5 leading-snug">
                          {fac.details}
                        </p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-ink-mute" />
                        <span className="text-[10px] font-bold text-ink-soft">
                          {fac.walkTimeFromGate}m walk
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-4 border border-white/[0.04] bg-white/[0.01] text-center py-6">
              <span className="text-xl">🗺️</span>
              <p className="text-[12.5px] text-ink-soft font-bold mt-1.5">No Block Selected</p>
              <p className="text-[10.5px] text-ink-mute mt-0.5">
                Tapping a section of the campus map highlights its boundaries and reveals all floor-level labs, library wings, and administrative desks.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. DIRECTORY LIST VIEW */}
      {activeTab === "directory" && (
        <div className="space-y-3">
          {/* search */}
          <div className="relative">
            <SearchIcon className="w-4 h-4 text-ink-mute absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-10"
              placeholder="Search labs, library, canteen, mess..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { key: "all", label: "All Facilities", icon: "✨" },
              { key: "lab", label: "Labs", icon: "💻" },
              { key: "food", label: "Food & Canteens", icon: "🍔" },
              { key: "hostel", label: "Hostels", icon: "🏠" },
              { key: "sports", label: "Sports Ground", icon: "⚽" },
              { key: "admin", label: "Admin Desks", icon: "💼" },
            ].map((c) => (
              <button
                key={c.key}
                onClick={() => setFilterCat(c.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition flex items-center gap-1 ${
                  filterCat === c.key ? "bg-brand-500 text-white" : "bg-white/[0.05] border border-white/10 text-ink-soft"
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Directory results */}
          <div className="space-y-2 max-h-[48vh] overflow-y-auto no-scrollbar pb-6 pr-1">
            {filteredFacilities.map((fac, idx) => (
              <div
                key={idx}
                className="card p-3 flex items-start gap-3 bg-[#0c0c0e]/85 border border-white/[0.07] hover:border-brand-500/20 transition-all duration-200"
              >
                <div
                  className="w-1.5 h-10 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: fac.blockColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink truncate leading-tight">
                      {fac.name}
                    </p>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/[0.05] text-[9.5px] font-bold text-ink-soft shrink-0">
                      {fac.floor}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-mute mt-0.5">
                    {fac.blockName}
                  </p>
                  <p className="text-[10.5px] text-ink-soft mt-1 leading-snug break-words">
                    {fac.details}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[9px] font-bold text-ink-soft border border-white/5 uppercase tracking-wider">
                    {fac.category}
                  </span>
                  <div className="flex items-center gap-1 text-ink-mute">
                    <ClockIcon className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{fac.walkTimeFromGate}m walk</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredFacilities.length === 0 && (
              <div className="py-12 text-center card bg-white/[0.01]">
                <span className="text-2xl">🔍</span>
                <p className="text-sm text-ink-mute mt-2">No facilities found. Try another search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. WALKING TIMES VIEW */}
      {activeTab === "times" && (
        <div className="space-y-4">
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-[18px]">
            <h4 className="text-xs font-black text-brand-200 uppercase tracking-wider flex items-center gap-1">
              <span>⏱️</span> Campus Transit Matrix
            </h4>
            <p className="text-[10.5px] text-brand-300 mt-1 leading-snug">
              Estimated offline walking transit times between major zones of the campus. Useful for ensuring you don&apos;t run late between classes!
            </p>
          </div>

          <div className="space-y-2 max-h-[48vh] overflow-y-auto no-scrollbar pb-6 pr-1">
            {HUB_DISTANCES.map((dist, idx) => (
              <div
                key={idx}
                className="card p-3.5 bg-[#0c0c0e]/85 border border-white/[0.07] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-center text-lg shrink-0">
                    {dist.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink-mute uppercase font-black tracking-wide">Transit Route</p>
                    <p className="text-[13px] font-bold text-ink truncate mt-0.5">
                      {dist.from} ➔ {dist.to}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-xl">
                  <span className="text-xs font-black text-brand-300">{dist.time} min</span>
                  <span className="text-[10px] text-brand-400">🚶</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
