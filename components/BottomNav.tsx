"use client";

import { HomeIcon, UsersIcon, StoreIcon, UserIcon, CampusIcon } from "./icons";

export type Tab = "home" | "connect" | "money" | "market" | "campus" | "profile";

const TABS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: "home", label: "Home", Icon: HomeIcon },
  { key: "connect", label: "Connect", Icon: UsersIcon },
  { key: "market", label: "Market", Icon: StoreIcon },
  { key: "campus", label: "Campus", Icon: CampusIcon },
  { key: "profile", label: "Profile", Icon: UserIcon },
];

export default function BottomNav({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 mx-auto max-w-[440px]">
      <div className="bg-black/80 backdrop-blur border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex">
          {TABS.map(({ key, label, Icon }) => {
            const on = active === key;
            return (
              <button
                key={key}
                onClick={() => onChange(key)}
                className="flex-1 flex flex-col items-center gap-1 py-1.5"
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    on ? "text-brand-500" : "text-ink-mute"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    on ? "text-brand-300" : "text-ink-mute"
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
