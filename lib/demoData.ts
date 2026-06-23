import { AppData, emptyData, SUBJECT_COLORS } from "./types";
import { todayISO, toISO } from "./dates";

let n = 0;
const id = () => `demo-${n++}`;

function dShift(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

/** A fully populated, good-looking demo dataset for the demo link. */
export function buildDemoData(): AppData {
  n = 0;
  const subjectNames = [
    "DBMS",
    "Operating Systems",
    "Maths III",
    "Computer Networks",
    "Economics",
  ];
  const subjects = subjectNames.map((name, i) => ({
    id: `subj-${i}`,
    name,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  // timetable: a believable week
  const slot = (
    day: any,
    subjIdx: number,
    start: string,
    room: string
  ) => ({
    id: id(),
    day,
    subjectId: subjects[subjIdx].id,
    start,
    end: start,
    room,
  });
  const timetable = [
    slot("mon", 0, "09:00", "204"),
    slot("mon", 1, "11:00", "Lab 2"),
    slot("mon", 2, "14:00", "108"),
    slot("tue", 3, "10:00", "301"),
    slot("tue", 4, "12:00", "210"),
    slot("wed", 0, "09:00", "204"),
    slot("wed", 1, "11:00", "Lab 2"),
    slot("thu", 2, "10:00", "108"),
    slot("thu", 3, "13:00", "301"),
    slot("fri", 4, "11:00", "210"),
    slot("fri", 0, "14:00", "204"),
  ];

  // attendance: ~3 weeks of records, ~83% overall, one subject in danger
  const attendance: AppData["attendance"] = [];
  subjects.forEach((s, si) => {
    const held = 14;
    // make Maths III (index 2) the danger subject (~64%)
    const rate = si === 2 ? 0.64 : si === 4 ? 0.78 : 0.88;
    for (let k = 0; k < held; k++) {
      const present = Math.random() < rate;
      attendance.push({
        id: id(),
        subjectId: s.id,
        date: dShift(-(k * 1 + si)),
        status: present ? "present" : "bunked",
      });
    }
  });

  const deadlines = [
    {
      id: id(),
      title: "DBMS assignment 3",
      subjectId: subjects[0].id,
      date: dShift(1),
      type: "assignment" as const,
      done: false,
    },
    {
      id: id(),
      title: "OS lab record submission",
      subjectId: subjects[1].id,
      date: dShift(3),
      type: "project" as const,
      done: false,
    },
    {
      id: id(),
      title: "Maths III mid-term",
      subjectId: subjects[2].id,
      date: dShift(6),
      type: "exam" as const,
      done: false,
    },
    {
      id: id(),
      title: "Economics essay",
      subjectId: subjects[4].id,
      date: dShift(-1),
      type: "assignment" as const,
      done: false,
    },
  ];

  const grades = [
    { id: id(), subjectId: subjects[0].id, semester: 1, credits: 4, score: 8.5 },
    { id: id(), subjectId: subjects[1].id, semester: 1, credits: 4, score: 9 },
    { id: id(), subjectId: subjects[2].id, semester: 1, credits: 3, score: 7 },
    { id: id(), subjectId: subjects[3].id, semester: 1, credits: 3, score: 8 },
    { id: id(), subjectId: subjects[4].id, semester: 1, credits: 2, score: 9.5 },
  ];

  const m = todayISO().slice(0, 7);
  const exp = (
    amount: number,
    category: any,
    day: number,
    note: string
  ) => ({
    id: id(),
    amount,
    category,
    date: `${m}-${String(day).padStart(2, "0")}`,
    note,
  });
  const expenses = [
    exp(120, "food", 2, "Canteen lunch"),
    exp(60, "travel", 2, "Auto to college"),
    exp(450, "food", 4, "Dinner with friends"),
    exp(200, "books", 5, "Notebook + pens"),
    exp(150, "fun", 6, "Movie ticket"),
    exp(90, "food", 8, "Chai + samosa"),
    exp(300, "fun", 10, "Weekend outing"),
    exp(75, "travel", 11, "Bus pass top-up"),
    exp(180, "food", 12, "Biryani"),
  ];

  const splits = [
    {
      id: id(),
      total: 1200,
      people: ["Rohan", "Priya", "Karan"],
      paidBy: "me",
      date: dShift(-3),
      note: "Pizza night",
    },
  ];

  const business = {
    registered: true,
    name: "Aarav's Brownies",
    type: "sell" as const,
  };
  const orders = [
    {
      id: id(),
      customer: "Sneha",
      item: "6 fudge brownies",
      amount: 240,
      status: "paid" as const,
      date: dShift(-2),
    },
    {
      id: id(),
      customer: "Vikram",
      item: "Brownie box (12)",
      amount: 420,
      status: "paid" as const,
      date: dShift(-1),
    },
    {
      id: id(),
      customer: "Ananya",
      item: "4 walnut brownies",
      amount: 200,
      status: "new" as const,
      date: todayISO(),
    },
  ];

  const groups = [
    {
      id: id(),
      name: "DBMS Project Team",
      subjectId: subjects[0].id,
      members: ["Rohan", "Priya"],
      tasks: [
        { id: id(), title: "Design ER diagram", assignee: "me", done: true, status: "done" as const, createdAt: hoursAgo(28) },
        { id: id(), title: "Write SQL schema", assignee: "Rohan", done: true, status: "done" as const, createdAt: hoursAgo(26) },
        { id: id(), title: "Build the report", assignee: "Priya", done: false, status: "todo" as const, createdAt: hoursAgo(24) },
      ],
      notes: "Submission due next week. Meet Thursday 4pm in library.",
      dueDate: dShift(5),
      createdAt: new Date().toISOString(),
      messages: [
        { id: id(), sender: "Rohan", text: "Guys the ER diagram is done ✅", at: hoursAgo(26) },
        { id: id(), sender: "me", text: "Nice! I'll start the SQL schema tonight", at: hoursAgo(25) },
        { id: id(), sender: "Priya", text: "I'll handle the report section", at: hoursAgo(24) },
        { id: id(), sender: "Rohan", text: "Library at 4 on Thursday works?", at: hoursAgo(3) },
        { id: id(), sender: "Priya", text: "Works for me 👍", at: hoursAgo(2) },
      ],
    },
    {
      id: id(),
      name: "OS Exam Squad",
      subjectId: subjects[1].id,
      members: ["Karan", "Meera", "Dev"],
      tasks: [
        { id: id(), title: "Share scheduling notes", assignee: "Karan", done: true, status: "done" as const, createdAt: hoursAgo(8) },
        { id: id(), title: "Solve last 5 papers", assignee: "me", done: false, status: "todo" as const, createdAt: hoursAgo(5) },
      ],
      notes: "Focus on memory management + deadlocks.",
      createdAt: new Date().toISOString(),
      messages: [
        { id: id(), sender: "Karan", text: "Uploaded the scheduling notes 📚", at: hoursAgo(8) },
        { id: id(), sender: "Meera", text: "Legend, thanks!", at: hoursAgo(7) },
        { id: id(), sender: "me", text: "Doing last 5 papers this weekend, who's in?", at: hoursAgo(5) },
        { id: id(), sender: "Dev", text: "Count me in 🔥", at: hoursAgo(1) },
      ],
    },
    {
      id: id(),
      name: "Rohan Mehta",
      direct: true,
      members: ["Rohan Mehta"],
      tasks: [],
      notes: "",
      createdAt: new Date().toISOString(),
      messages: [
        { id: id(), sender: "Rohan Mehta", text: "yo did you get the DBMS notes?", at: hoursAgo(20) },
        { id: id(), sender: "me", text: "yeah just sent them on the group", at: hoursAgo(19) },
        { id: id(), sender: "Rohan Mehta", text: "legend 🙏 also are we still on for the project meet?", at: hoursAgo(2) },
      ],
    },
    {
      id: id(),
      name: "Priya Sharma",
      direct: true,
      members: ["Priya Sharma"],
      tasks: [],
      notes: "",
      createdAt: new Date().toISOString(),
      messages: [
        { id: id(), sender: "me", text: "can you cover my attendance for stats tmrw?", at: hoursAgo(30) },
        { id: id(), sender: "Priya Sharma", text: "yep got you 👍", at: hoursAgo(29) },
        { id: id(), sender: "Priya Sharma", text: "you owe me chai btw ☕", at: hoursAgo(28) },
      ],
    },
    {
      id: id(),
      name: "Sneha Patel",
      direct: true,
      isRequest: true,
      members: ["Sneha Patel"],
      tasks: [],
      notes: "",
      createdAt: new Date().toISOString(),
      messages: [
        { id: id(), sender: "Sneha Patel", text: "Proposed Offer: ₹200 for 6 fudge brownies. Hey Aarav, can I get these delivered to Hostel 3 tonight? 🍪", at: hoursAgo(1) }
      ],
    },
  ];

  const listings = [
    {
      id: id(),
      title: "Brownies — fresh batch daily",
      category: "food" as const,
      price: 40,
      priceUnit: "per piece",
      description:
        "Homemade fudge & walnut brownies. Order on WhatsApp, delivered to your hostel.",
      seller: "Aarav (You)",
      contact: "9876543210",
      image:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=60",
      mine: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const notifications = [
    {
      id: "n-1",
      title: "💰 New Offer Request",
      body: "Sneha Patel offered ₹200 for your fudge brownies.",
      type: "offer" as const,
      link: "connect:requests",
      read: false,
      createdAt: hoursAgo(1),
    },
    {
      id: "n-2",
      title: "📝 Assignment Due Soon",
      body: "DBMS Lab Assignment is due in 2 days. Don't forget to submit!",
      type: "deadline" as const,
      link: "home:deadlines",
      read: false,
      createdAt: hoursAgo(5),
    },
    {
      id: "n-3",
      title: "👥 Group Meeting Scheduled",
      body: "CS Hackathon group scheduled a study session for Friday at 4 PM.",
      type: "task" as const,
      link: "connect:groups",
      read: true,
      createdAt: hoursAgo(24),
    },
  ];

  return {
    ...emptyData,
    profile: {
      name: "Aarav",
      attendanceTarget: 0.75,
      gradeSystem: "gpa10",
      onboarded: true,
      monthlyBudget: 4000,
    },
    subjects,
    timetable,
    attendance,
    deadlines,
    grades,
    expenses,
    splits,
    business,
    orders,
    groups,
    listings,
    notifications,
    reminders: { ...emptyData.reminders, enabled: true },
  };
}
