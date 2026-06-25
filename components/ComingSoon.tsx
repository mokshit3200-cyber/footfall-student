"use client";

import { UsersIcon, StoreIcon } from "./icons";

const CONFIG = {
  connect: {
    Icon: UsersIcon,
    title: "Connect",
    tagline: "Your campus crew, in one place.",
    items: [
      "Study & project groups with shared deadlines",
      "Auto-connect with classmates from your timetable",
      "Shared notes & past papers",
      "Ask doubts, get help from seniors",
    ],
  },
  market: {
    Icon: StoreIcon,
    title: "Marketplace",
    tagline: "Buy, sell & hire — right on campus.",
    items: [
      "Student sellers: merch, food, products",
      "Freelancers: design, photos, tutoring",
      "Local shops & cafés near you",
      "Pay safely through Cmpus",
    ],
  },
};

export default function ComingSoon({ tab }: { tab: "connect" | "market" }) {
  const c = CONFIG[tab];
  return (
    <div className="px-5 pt-12 pb-28 min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-5">
          <c.Icon className="w-8 h-8 text-brand-300" />
        </div>
        <span className="pill bg-amber-500/20 text-amber-300 mb-3">
          Coming soon
        </span>
        <h1 className="text-2xl font-bold text-ink mb-1">{c.title}</h1>
        <p className="text-ink-mute text-[15px] mb-7 max-w-[280px]">
          {c.tagline}
        </p>
        <div className="w-full max-w-[320px] space-y-2 text-left">
          {c.items.map((it, i) => (
            <div key={i} className="card p-3.5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
                <span className="text-brand-300 text-xs font-bold">{i + 1}</span>
              </div>
              <span className="text-[13px] text-ink-soft">{it}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
