interface P {
  className?: string;
}

const C = "currentColor";
const sw = 1.7;

/* ── Bottom-nav icons (refined, rounded, modern) ─────────────── */
export const HomeIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11.4 12 4.5l8 6.9" />
    <path d="M6 10.2V19a1 1 0 0 0 1 1h3v-4.4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3a1 1 0 0 0 1-1v-8.8" />
  </svg>
);

export const WalletIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a1 1 0 0 1 1 1v1.5" />
    <rect x="3" y="7.5" width="18" height="12" rx="3" />
    <path d="M16 13.4h1.8" />
  </svg>
);

export const UsersIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8.5" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.2a3 3 0 0 1 .2 5.6M17.5 19a5.6 5.6 0 0 0-2.3-4.5" />
  </svg>
);

export const StoreIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9.2V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.2" />
    <path d="M3.6 6.5 5 4h14l1.4 2.5a2.4 2.4 0 0 1-4.5 1.1 2.4 2.4 0 0 1-4.9 0 2.4 2.4 0 0 1-4.9 0A2.4 2.4 0 0 1 3.6 6.5Z" />
    <path d="M10 20v-4.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20" />
  </svg>
);

export const UserIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
  </svg>
);

/* ── Connect / chat icons ────────────────────────────────────── */
export const SearchIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);

export const SendIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12 3.5 5.2a.7.7 0 0 1 .95-.8l15.5 6.8a.7.7 0 0 1 0 1.28L4.45 19.6a.7.7 0 0 1-.95-.8L5 12Z" />
    <path d="M5 12h7" />
  </svg>
);

export const ChatIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V16H6a2 2 0 0 1-2-2Z" />
  </svg>
);

export const DotsIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="12" r="1.4" fill={C} stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill={C} stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill={C} stroke="none" />
  </svg>
);

export const UserPlusIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="8.5" r="3.2" />
    <path d="M4 19a6 6 0 0 1 11.3-2.8" />
    <path d="M18 14v5M15.5 16.5h5" />
  </svg>
);

export const ArrowLeftIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/* ── General icons ───────────────────────────────────────────── */
export const CalendarIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 9.5h17M8 3.2v3.4M16 3.2v3.4" />
  </svg>
);

export const ClockIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const CheckIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const PlusIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BookIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5.5 4h9A2.5 2.5 0 0 1 17 6.5V20H8a2.5 2.5 0 0 1-2.5-2.5Z" />
    <path d="M5.5 17.5A2.5 2.5 0 0 1 8 15h9" />
  </svg>
);

export const BriefcaseIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7.5" width="18" height="12.5" rx="2.5" />
    <path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5M3 12.5h18" />
  </svg>
);

export const ChevronRight = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5.5l6.5 6.5L9 18.5" />
  </svg>
);

export const SparkIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5c.4 3.6 2.4 5.6 6 6-3.6.4-5.6 2.4-6 6-.4-3.6-2.4-5.6-6-6 3.6-.4 5.6-2.4 6-6Z" />
    <path d="M18.5 4.5c.15 1 .65 1.5 1.5 1.6-.85.15-1.35.65-1.5 1.5-.15-.85-.65-1.35-1.5-1.5.85-.15 1.35-.6 1.5-1.6Z" />
  </svg>
);

export const TrashIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 7h15M9.5 7V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L18.5 7" />
  </svg>
);

export const XIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const CampusIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z" />
    <path d="M6 10v5.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5V10" />
    <path d="M21 7.5V13" />
  </svg>
);

export const BellIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const GearIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const ArrowUpIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const ArrowDownIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

/* ── Chat / Messages icons (emoji replacements) ───────────────── */
export const PhoneIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.6 4h3l1.4 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.4v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 6.2 2 2 0 0 1 6.6 4Z" />
  </svg>
);

export const VideoIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="6.5" width="12.5" height="11" rx="2.5" />
    <path d="M15.5 10.5 21 7.5v9l-5.5-3" />
  </svg>
);

export const CameraIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.7l1-1.6a1 1 0 0 1 .85-.4h3.9a1 1 0 0 1 .85.4L15.8 7h2.7A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5Z" />
    <circle cx="12" cy="12.2" r="3.2" />
  </svg>
);

export const MicIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </svg>
);

export const ImageIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L17 18" />
  </svg>
);

export const PaperclipIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 10.5 11.3 18a4 4 0 0 1-5.7-5.7l8-8a2.7 2.7 0 0 1 3.8 3.8l-7.8 7.8a1.4 1.4 0 0 1-2-2l7-7" />
  </svg>
);

export const SmileIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.5 14a4 4 0 0 0 7 0" />
    <path d="M9 9.5h.01M15 9.5h.01" />
  </svg>
);

export const PaletteIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 2-2 0-1.3-1-1.5-1-2.7a1.8 1.8 0 0 1 1.8-1.8H17a3.5 3.5 0 0 0 3.5-3.7A8.7 8.7 0 0 0 12 3.5Z" />
    <circle cx="8" cy="11" r="1" fill={C} stroke="none" />
    <circle cx="12" cy="8.5" r="1" fill={C} stroke="none" />
    <circle cx="16" cy="11" r="1" fill={C} stroke="none" />
  </svg>
);

export const LockIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const ShieldIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5 5 6v5c0 4.2 2.9 7.5 7 9 4.1-1.5 7-4.8 7-9V6l-7-2.5Z" />
  </svg>
);

export const EyeIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOffIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 5.8A8 8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a14 14 0 0 1-3 3.6M6.2 7.6A14 14 0 0 0 2.5 12S6 18.5 12 18.5a8 8 0 0 0 3.3-.7" />
    <path d="M9.8 9.9a3 3 0 0 0 4.2 4.3M3 3l18 18" />
  </svg>
);

export const PinIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5Z" />
    <path d="M12 14v6" />
  </svg>
);

export const BellOffIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.7 5.2A6 6 0 0 1 18 8c0 4 1.3 6.2 2.3 7.5M6.1 8.9C6 12.5 4.5 14 3.5 15.5a.7.7 0 0 0 .6 1.1h13M10.3 20a1.94 1.94 0 0 0 3.4 0M3 3l18 18" />
  </svg>
);

export const MailIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m4 7 8 5.5L20 7" />
  </svg>
);

export const BanIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="m6 6 12 12" />
  </svg>
);

export const AlertIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4M12 17.5h.01" />
  </svg>
);

export const FlagIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 21V4M5 4h11l-1.5 4L16 12H5" />
  </svg>
);

export const SignalIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 9a10 10 0 0 1 15 0M7 11.7a6.5 6.5 0 0 1 10 0" />
    <circle cx="12" cy="16" r="2" fill={C} stroke="none" />
  </svg>
);

export const LinkIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
    <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5L12.5 17" />
  </svg>
);

export const FileIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h7l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
    <path d="M13 3v5h5" />
  </svg>
);

export const EditIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h8" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const CheckCheckIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13.5 6 17.5 13.5 9" />
    <path d="M11 14.5 12.5 16 21 7.5" />
  </svg>
);

export const MapPinIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const GraduationIcon = ({ className }: P) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={C} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 8.5 12 4.5l9.5 4-9.5 4-9.5-4Z" />
    <path d="M6.5 10.5V15c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.5M21.5 8.5v5" />
  </svg>
);
