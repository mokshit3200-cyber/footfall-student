import {
  CoffeeIcon,
  BookIcon,
  HelpIcon,
  UsersGroupIcon,
  ConfettiIcon,
  TagIcon
} from "@/components/icons";

export const INTENTS = [
  { id: "free", label: "Free now", color: "#22c55e", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", activeBg: "bg-emerald-500 text-white border-emerald-500", icon: CoffeeIcon },
  { id: "study", label: "Studying", color: "#3b82f6", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", activeBg: "bg-blue-500 text-white border-blue-500", icon: BookIcon },
  { id: "help", label: "Need help", color: "#f59e0b", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", activeBg: "bg-amber-500 text-white border-amber-500", icon: HelpIcon },
  { id: "looking", label: "Looking for", color: "#8b5cf6", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", activeBg: "bg-purple-500 text-white border-purple-500", icon: UsersGroupIcon },
  { id: "event", label: "Event", color: "#ec4899", bg: "bg-pink-500/10 text-pink-400 border-pink-500/20", activeBg: "bg-pink-500 text-white border-pink-500", icon: ConfettiIcon },
  { id: "sell", label: "Sell", color: "#14b8a6", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20", activeBg: "bg-teal-500 text-white border-teal-500", icon: TagIcon },
];
