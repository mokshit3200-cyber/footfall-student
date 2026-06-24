export type GradeSystem = "percentage" | "gpa10";

export interface Story {
  id: string;
  userId: string; // classmate ID or "me"
  userName: string;
  userAvatar: string;
  mediaUrl: string; // text caption or base64 image data url
  mediaType: "text" | "image";
  caption?: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  title: string;
  coverEmoji: string;
  stories: Story[];
}

export interface Profile {
  name: string;
  username?: string | null;
  verified?: boolean;
  college?: string;
  year?: number;
  attendanceTarget: number; // 0.75 = 75%
  gradeSystem: GradeSystem;
  onboarded: boolean;
  monthlyBudget: number; // 0 = not set
  course?: string;
  avatar?: string;
  followersCount?: number;
  followingCount?: number;
  highlights?: Highlight[];
  stories?: Story[];
  soundEnabled?: boolean;
  bio?: string;
  skills?: string[];
  links?: { github?: string; linkedin?: string; instagram?: string; portfolio?: string };
}

export interface Subject {
  id: string;
  name: string;
  color: string;
}

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface ClassSlot {
  id: string;
  day: DayKey;
  subjectId: string;
  start: string; // "11:00"
  end: string; // "12:00"
  room?: string;
  teacher?: string;
}

export type AttStatus = "present" | "bunked" | "cancelled";

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  slotId?: string;
  status: AttStatus;
}

export type DeadlineType = "assignment" | "exam" | "project";

export interface Deadline {
  id: string;
  title: string;
  subjectId?: string;
  date: string; // YYYY-MM-DD
  type: DeadlineType;
  done: boolean;
}

export interface Grade {
  id: string;
  subjectId: string;
  semester: number;
  credits: number;
  score: number; // percentage 0-100 OR grade-point 0-10 depending on system
}

export type ExpenseCategory = "food" | "travel" | "fun" | "books" | "other";

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface SplitBill {
  id: string;
  total: number;
  people: string[];
  paidBy: string; // "me" or a name
  date: string;
  note?: string;
}

export type BusinessType = "sell" | "service" | "club";

export interface Business {
  registered: boolean;
  name: string;
  type: BusinessType;
}

export interface Order {
  id: string;
  customer: string;
  item: string;
  amount: number;
  status: "new" | "fulfilled" | "paid";
  date: string;
}

/* ── Connect tab (groups & collaboration) — owned by Antigravity ── */
export interface GroupTask {
  id: string;
  title: string;
  assignee?: string; // member name or "me"
  done: boolean;
  status?: "todo" | "progress" | "done";
  createdAt?: string;
}

export interface GroupMessage {
  id: string;
  sender: string; // member name, or "me"
  text: string;
  at: string; // ISO timestamp
  attachment?: {
    name: string;
    url: string; // base64 data-url or dummy url
    type: "image" | "file";
  };
}

export interface GroupPoll {
  id: string;
  question: string;
  options: { text: string; votes: string[] }[]; // votes: list of classmate names or "me"
  createdAt: string;
}

export interface GroupEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venue: string;
  createdAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  subjectId?: string;
  members: string[]; // names; "me" is implicit owner
  tasks: GroupTask[];
  notes: string;
  dueDate?: string; // YYYY-MM-DD optional shared deadline
  createdAt: string;
  messages?: GroupMessage[]; // chat thread
  direct?: boolean; // true = 1-on-1 DM (members has one person)
  polls?: GroupPoll[];
  isRequest?: boolean; // true = Instagram-style Message Request
  events?: GroupEvent[];
}

export interface ReminderSettings {
  enabled: boolean;          // master (permission granted + user on)
  classReminders: boolean;
  classLeadMin: number;      // default 15
  deadlineReminders: boolean;
  deadlineLeadDays: number;  // default 1
  attendanceNudge: boolean;
  dailyAgenda: boolean;
}

export type ListingCategory =
  | "food" | "tutoring" | "design" | "products" | "services" | "rentals" | "other";

export interface Listing {
  id: string;
  title: string;
  category: ListingCategory;
  price: number;          // 0 = contact for price
  priceUnit?: string;     // "per hour", "per plate"
  description: string;
  seller: string;
  contact?: string;       // phone or instagram handle
  image?: string;         // url or base64 data-url
  mine: boolean;          // true if created by this student
  createdAt: string;
  active?: boolean;       // false = sold/deactivated
  userId?: string;        // Supabase user_id of seller
}

export interface Classmate {
  id: string;
  name: string;
  course: string;
  avatar: string; // emoji
  followersCount: number;
  followingCount: number;
  followed: boolean;
  stories: Story[];
  highlights?: Highlight[];
  timetable?: ClassSlot[];
  bio?: string;
  skills?: string[];
  links?: { github?: string; linkedin?: string; instagram?: string; portfolio?: string };
  business?: { name: string; type: "sell" | "service" | "club"; contact?: string };
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  type: "offer" | "deadline" | "system" | "task";
  link?: string; // Deep-linking metadata! e.g., "connect:requests", "connect:chats:chat-id", "home:deadlines"
  read: boolean;
  createdAt: string;
}

export interface AppData {
  profile: Profile;
  subjects: Subject[];
  timetable: ClassSlot[];
  attendance: AttendanceRecord[];
  deadlines: Deadline[];
  grades: Grade[];
  expenses: Expense[];
  splits: SplitBill[];
  business: Business | null;
  orders: Order[];
  groups: StudyGroup[];
  reminders: ReminderSettings;
  listings: Listing[];
  classmates?: Classmate[];
  notifications?: InAppNotification[];
}

export const SUBJECT_COLORS = [
  "#7c3aed",
  "#3b82f6",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
];

export const emptyData: AppData = {
  profile: {
    name: "",
    college: "",
    year: 1,
    attendanceTarget: 0.75,
    gradeSystem: "gpa10",
    onboarded: false,
    monthlyBudget: 0,
    course: "B.Tech Computer Science",
    avatar: "👨‍💻",
    followersCount: 142,
    followingCount: 98,
    highlights: [],
    stories: [],
    soundEnabled: true,
  },
  subjects: [],
  timetable: [],
  attendance: [],
  deadlines: [],
  grades: [],
  expenses: [],
  splits: [],
  business: null,
  orders: [],
  groups: [],
  reminders: {
    enabled: false,
    classReminders: true,
    classLeadMin: 15,
    deadlineReminders: true,
    deadlineLeadDays: 1,
    attendanceNudge: true,
    dailyAgenda: false,
  },
  listings: [],
  notifications: [],
  classmates: [
    {
      id: "class-1",
      name: "Aarav Sharma",
      course: "B.Tech Computer Science",
      avatar: "🎓",
      followersCount: 184,
      followingCount: 120,
      followed: true,
      stories: [
        {
          id: "s-1",
          userId: "class-1",
          userName: "Aarav Sharma",
          userAvatar: "🎓",
          mediaType: "text",
          mediaUrl: "Coding all night for the Hackathon! 💻🔥 Let's win this guys!",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ],
      highlights: [
        {
          id: "h-1",
          title: "Hackathon",
          coverEmoji: "💻",
          stories: [
            {
              id: "s-1-h",
              userId: "class-1",
              userName: "Aarav Sharma",
              userAvatar: "🎓",
              mediaType: "text",
              mediaUrl: "Team registration done! Let's build something awesome.",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
          ]
        }
      ],
      bio: "Final-year CS student obsessed with full-stack dev & hackathons. Building cool things at Footfall.",
      skills: ["React", "Node.js", "Python", "DSA", "Firebase"],
      links: { github: "aaravsharma", linkedin: "aarav-sharma", instagram: "aarav.dev" },
      business: { name: "Aarav's Study Kits", type: "sell", contact: "+91 91234 56789" },
      timetable: [
        { id: "c1-s1", day: "mon", subjectId: "sub-1", start: "09:00", end: "10:00" },
        { id: "c1-s2", day: "tue", subjectId: "sub-2", start: "11:00", end: "12:00" },
        { id: "c1-s3", day: "wed", subjectId: "sub-3", start: "14:00", end: "15:00" },
        { id: "c1-s4", day: "thu", subjectId: "sub-4", start: "10:00", end: "11:00" },
        { id: "c1-s5", day: "fri", subjectId: "sub-5", start: "13:00", end: "14:00" }
      ]
    },
    {
      id: "class-2",
      name: "Karan Singh",
      course: "B.Tech Food Tech",
      avatar: "🍔",
      followersCount: 95,
      followingCount: 64,
      followed: false,
      stories: [
        {
          id: "s-2",
          userId: "class-2",
          userName: "Karan Singh",
          userAvatar: "🍔",
          mediaType: "text",
          mediaUrl: "Authentic Chicken Biryani is ready! Deliveries start at 6 PM. 🍛🤤",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        }
      ],
      highlights: [
        {
          id: "h-2",
          title: "Food PG",
          coverEmoji: "🍛",
          stories: [
            {
              id: "s-2-h",
              userId: "class-2",
              userName: "Karan Singh",
              userAvatar: "🍔",
              mediaType: "text",
              mediaUrl: "Tried baking double-chocolate cookies today. Nailed it! 🍪",
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            }
          ]
        }
      ],
      bio: "Food Tech student & home chef. Running Karan's Kitchen — hostel delivery, biryani & cookies every Friday.",
      skills: ["Cooking", "Food Science", "Entrepreneurship", "Supply Chain"],
      links: { instagram: "karans.kitchen" },
      business: { name: "Karan's Kitchen", type: "sell", contact: "+91 98765 43210" },
      timetable: [
        { id: "c2-s1", day: "mon", subjectId: "sub-1", start: "10:00", end: "11:00" },
        { id: "c2-s2", day: "tue", subjectId: "sub-2", start: "14:00", end: "15:00" },
        { id: "c2-s3", day: "wed", subjectId: "sub-3", start: "11:00", end: "12:00" },
        { id: "c2-s4", day: "thu", subjectId: "sub-4", start: "09:00", end: "10:00" },
        { id: "c2-s5", day: "fri", subjectId: "sub-5", start: "15:00", end: "16:00" }
      ]
    },
    {
      id: "class-3",
      name: "Sneha Patel",
      course: "B.Sc Physics",
      avatar: "🔬",
      followersCount: 210,
      followingCount: 154,
      followed: true,
      stories: [
        {
          id: "s-3",
          userId: "class-3",
          userName: "Sneha Patel",
          userAvatar: "🔬",
          mediaType: "text",
          mediaUrl: "Obsessed with telescope views tonight! Spotting Saturn's rings 🪐🌌",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        }
      ],
      highlights: [
        {
          id: "h-3",
          title: "Astro",
          coverEmoji: "🌌",
          stories: [
            {
              id: "s-3-h",
              userId: "class-3",
              userName: "Sneha Patel",
              userAvatar: "🔬",
              mediaType: "text",
              mediaUrl: "Stargazing session in the campus field! ✨",
              createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            }
          ]
        }
      ],
      bio: "Physics undergrad & stargazer. Tutoring Python & Data Science. Placed sessions at the campus library.",
      skills: ["Python", "Data Science", "DBMS", "Physics", "Astrophysics"],
      links: { instagram: "sneha_codes", linkedin: "sneha-patel-physics" },
      business: { name: "Sneha Tutors", type: "service", contact: "sneha_codes" },
      timetable: [
        { id: "c3-s1", day: "mon", subjectId: "sub-1", start: "11:00", end: "12:00" },
        { id: "c3-s2", day: "tue", subjectId: "sub-2", start: "09:00", end: "10:00" },
        { id: "c3-s3", day: "wed", subjectId: "sub-3", start: "10:00", end: "11:00" },
        { id: "c3-s4", day: "thu", subjectId: "sub-4", start: "14:00", end: "15:00" },
        { id: "c3-s5", day: "fri", subjectId: "sub-5", start: "10:00", end: "11:00" }
      ]
    },
    {
      id: "class-4",
      name: "Rahul Varma",
      course: "B.Des Fashion Design",
      avatar: "🎨",
      followersCount: 120,
      followingCount: 92,
      followed: false,
      stories: [
        {
          id: "s-4",
          userId: "class-4",
          userName: "Rahul Varma",
          userAvatar: "🎨",
          mediaType: "text",
          mediaUrl: "Doodling ideas for the new college merch. Which design is better? 👕🎨",
          createdAt: new Date(Date.now() - 5400000).toISOString(),
        }
      ],
      bio: "B.Des Fashion student & visual designer. Creating logos, UI mockups, and merch for student startups.",
      skills: ["UI/UX", "Figma", "Branding", "Illustration", "Fashion Design"],
      links: { instagram: "rahul_designs", portfolio: "rahulvarma.design" },
      timetable: [
        { id: "c4-s1", day: "mon", subjectId: "sub-1", start: "14:00", end: "15:00" },
        { id: "c4-s2", day: "tue", subjectId: "sub-2", start: "10:00", end: "11:00" },
        { id: "c4-s3", day: "wed", subjectId: "sub-3", start: "09:00", end: "10:00" },
        { id: "c4-s4", day: "thu", subjectId: "sub-4", start: "11:00", end: "12:00" },
        { id: "c4-s5", day: "fri", subjectId: "sub-5", start: "11:00", end: "12:00" }
      ]
    },
    {
      id: "class-5",
      name: "Preeti Kaur",
      course: "B.A. English Lit",
      avatar: "📚",
      followersCount: 135,
      followingCount: 88,
      followed: false,
      stories: [
        {
          id: "s-5",
          userId: "class-5",
          userName: "Preeti Kaur",
          userAvatar: "📚",
          mediaType: "text",
          mediaUrl: "Current read: 'The God of Small Things' by Arundhati Roy. Intrigued! 📖✨",
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        }
      ],
      bio: "English Lit lover, avid reader, and campus book club organiser. Gear cycle rental on the side 🚴",
      skills: ["Creative Writing", "Literary Analysis", "Event Planning", "Blogging"],
      links: { instagram: "preeti.reads" },
      timetable: [
        { id: "c5-s1", day: "mon", subjectId: "sub-1", start: "15:00", end: "16:00" },
        { id: "c5-s2", day: "tue", subjectId: "sub-2", start: "15:00", end: "16:00" },
        { id: "c5-s3", day: "wed", subjectId: "sub-3", start: "15:00", end: "16:00" },
        { id: "c5-s4", day: "thu", subjectId: "sub-4", start: "15:00", end: "16:00" },
        { id: "c5-s5", day: "fri", subjectId: "sub-5", start: "14:00", end: "15:00" }
      ]
    }
  ]
};
