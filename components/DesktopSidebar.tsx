"use client";

import { Tab } from "./BottomNav";
import { useStore } from "./store";
import {
  HomeIcon,
  UsersIcon,
  StoreIcon,
  UserIcon,
  ChatIcon,
} from "./icons";

const ITEMS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "Home", Icon: HomeIcon },
  { key: "connect", label: "Connect", Icon: UsersIcon },
  { key: "messages", label: "Messages", Icon: ChatIcon },
  { key: "market", label: "Marketplace", Icon: StoreIcon },
  { key: "profile", label: "Profile", Icon: UserIcon },
];

export default function DesktopSidebar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  const { data } = useStore();
  return (
    <aside className="hidden md:flex md:flex-col md:w-[244px] md:shrink-0 md:h-screen md:sticky md:top-0 border-r border-white/10 bg-[#0e0e0e] px-4 py-6">
      {/* brand */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl brand-gradient flex items-center justify-center shadow-md shadow-brand-500/20">
          <span className="text-white font-bold">F</span>
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-bold text-ink">Footfall</p>
          <p className="text-[11px] text-ink-mute">Student</p>
        </div>
      </div>

      {/* nav */}
      <nav className="space-y-1 flex-1">
        {ITEMS.map(({ key, label, Icon }) => {
          const on = active === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition ${
                on
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-ink-soft hover:bg-white/[0.05]"
              }`}
            >
              <Icon
                className={`w-[22px] h-[22px] ${
                  on ? "text-brand-300" : "text-ink-mute"
                }`}
              />
              {label}
            </button>
          );
        })}
      </nav>

      {/* user */}
      <button
        onClick={() => onChange("profile")}
        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition"
      >
        <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">
            {data.profile.name?.[0]?.toUpperCase() || "F"}
          </span>
        </div>
        <div className="text-left min-w-0">
          <p className="text-sm font-bold text-ink truncate">
            {data.profile.name || "Student"}
          </p>
          <p className="text-[11px] text-ink-mute">Student account</p>
        </div>
      </button>
    </aside>
  );
}
