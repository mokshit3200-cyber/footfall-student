"use client";

import { useMemo, useState } from "react";
import { Sheet } from "./ui";
import { SearchIcon, PlusIcon, XIcon, ClockIcon } from "./icons";
import CampusMap from "./CampusMap";

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=60`;

/* ───────────────────────── DATA ───────────────────────── */
type Section = "food" | "events" | "directions" | "info";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  veg: boolean;
  desc: string;
}
interface Outlet {
  id: string;
  name: string;
  tag: string;
  rating: string;
  eta: string;
  image: string;
  menu: MenuItem[];
}

const OUTLETS: Outlet[] = [
  {
    id: "o1",
    name: "Main Cafeteria",
    tag: "South Indian · Snacks",
    rating: "4.3",
    eta: "10-15 min",
    image: U("1567620905732-2d1ec7ab7445"),
    menu: [
      { id: "m1", name: "Masala Dosa", price: 60, veg: true, desc: "Crispy dosa, potato masala, chutney & sambar" },
      { id: "m2", name: "Veg Fried Rice", price: 80, veg: true, desc: "Wok-tossed rice with garden veggies" },
      { id: "m3", name: "Chicken Biryani", price: 120, veg: false, desc: "Hyderabadi dum biryani with raita" },
      { id: "m4", name: "Samosa (2 pc)", price: 30, veg: true, desc: "Hot crispy samosas with mint chutney" },
    ],
  },
  {
    id: "o2",
    name: "Nescafe Kiosk",
    tag: "Coffee · Beverages",
    rating: "4.6",
    eta: "5-8 min",
    image: U("1461023058943-07fcbe16d735"),
    menu: [
      { id: "m5", name: "Cold Coffee", price: 70, veg: true, desc: "Thick, frothy & chilled" },
      { id: "m6", name: "Cappuccino", price: 50, veg: true, desc: "Hot espresso with steamed milk" },
      { id: "m7", name: "Iced Tea", price: 40, veg: true, desc: "Lemon iced tea, refreshing" },
      { id: "m8", name: "Veg Puff", price: 25, veg: true, desc: "Flaky pastry, spiced veg filling" },
    ],
  },
  {
    id: "o3",
    name: "Hostel Mess Night Canteen",
    tag: "Maggi · Rolls · Late night",
    rating: "4.1",
    eta: "12-18 min",
    image: U("1585032226651-759b368d7246"),
    menu: [
      { id: "m9", name: "Cheese Maggi", price: 45, veg: true, desc: "Loaded with cheese & veggies" },
      { id: "m10", name: "Egg Roll", price: 55, veg: false, desc: "Double egg, onion & sauce roll" },
      { id: "m11", name: "Paneer Roll", price: 65, veg: true, desc: "Spiced paneer wrapped in paratha" },
      { id: "m12", name: "Bun Omelette", price: 40, veg: false, desc: "Classic late-night fuel" },
    ],
  },
];

interface OffEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  price: number;
  tag: string;
  organiser: string;
  image: string;
  left: number;
}
const OFFICIAL_EVENTS: OffEvent[] = [
  { id: "ev1", title: "Annual Tech Fest — INNOVATE'26", date: "Sat, 28 Jun · 10:00 AM", venue: "Main Auditorium", price: 199, tag: "Official", organiser: "Student Council", image: U("1540575467063-178a50c2df87"), left: 64 },
  { id: "ev2", title: "Convocation Cultural Evening", date: "Fri, 4 Jul · 6:30 PM", venue: "Open Air Theatre", price: 149, tag: "Official", organiser: "Cultural Committee", image: U("1492684223066-81342ee5ff30"), left: 120 },
  { id: "ev3", title: "Sports Meet — Opening Ceremony", date: "Mon, 7 Jul · 8:00 AM", venue: "Main Ground", price: 0, tag: "Official", organiser: "Sports Dept", image: U("1431324155629-1a6deb1dec8d"), left: 300 },
  { id: "ev4", title: "Alumni Networking Gala", date: "Sat, 12 Jul · 7:00 PM", venue: "Convention Hall", price: 299, tag: "Official", organiser: "Alumni Cell", image: U("1511795409834-ef04bbd61622"), left: 41 },
];

const CAMPUS_INFO = [
  { icon: "🏛️", label: "Registrar / Admin Office", value: "Block B, Ground Floor · 9 AM – 5 PM", action: "tel:+914023456789" },
  { icon: "🩺", label: "Campus Medical Room", value: "Near Hostel Block · 24×7 on-call", action: "tel:+914023456700" },
  { icon: "🛡️", label: "Security Helpdesk", value: "Main Gate · Emergency 24×7", action: "tel:+914023456711" },
  { icon: "📶", label: "Campus Wi-Fi", value: "SSID: CAMPUS-NET · password at IT desk", action: "" },
  { icon: "💼", label: "Placement & Internship Cell", value: "Block B, 3rd Floor · 10 AM – 4 PM", action: "" },
  { icon: "🚌", label: "Campus Shuttle", value: "Gate ↔ Hostels every 20 min · 7 AM – 9 PM", action: "" },
];

const SECTIONS: { key: Section; label: string; emoji: string }[] = [
  { key: "food", label: "Order Food", emoji: "🍔" },
  { key: "events", label: "Events", emoji: "🎟️" },
  { key: "directions", label: "Directions", emoji: "📍" },
  { key: "info", label: "Campus Info", emoji: "ℹ️" },
];

function SmartImg({ src, emoji }: { src?: string; emoji: string }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setErr(true)} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-white/[0.04]">
      <span className="text-4xl opacity-70">{emoji}</span>
    </div>
  );
}

const Veg = ({ veg }: { veg: boolean }) => (
  <span className={`inline-flex w-3.5 h-3.5 items-center justify-center border rounded-[3px] ${veg ? "border-green-500" : "border-red-500"}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${veg ? "bg-green-500" : "bg-red-500"}`} />
  </span>
);

/* ───────────────────────── COMPONENT ───────────────────────── */
export default function MyCampus() {
  const [section, setSection] = useState<Section>("food");
  const [search, setSearch] = useState("");
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [toast, setToast] = useState("");
  const [evt, setEvt] = useState<OffEvent | null>(null);

  function flash(m: string) { setToast(m); setTimeout(() => setToast(""), 1800); }

  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const cartTotal = useMemo(() => {
    let t = 0;
    OUTLETS.forEach((o) => o.menu.forEach((m) => { if (cart[m.id]) t += m.price * cart[m.id]; }));
    return t;
  }, [cart]);

  const outlets = useMemo(() => {
    const q = search.toLowerCase();
    return OUTLETS.filter((o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q));
  }, [search]);

  function addToCart(id: string) { setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })); }
  function removeFromCart(id: string) {
    setCart((c) => {
      const n = { ...c };
      if (n[id] > 1) n[id] -= 1; else delete n[id];
      return n;
    });
  }

  /* ── OUTLET MENU DETAIL ── */
  if (outlet) {
    return (
      <div className="min-h-screen pb-28">
        <div className="relative">
          <div className="aspect-[16/9] bg-white/[0.04] overflow-hidden">
            <SmartImg src={outlet.image} emoji="🍽️" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />
          <button onClick={() => setOutlet(null)} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 -mt-3 relative md:max-w-2xl md:mx-auto">
          <h1 className="text-2xl font-extrabold text-ink">{outlet.name}</h1>
          <p className="text-sm text-ink-mute mt-1">{outlet.tag}</p>
          <div className="flex items-center gap-2 mt-3 text-[12px]">
            <span className="pill bg-green-500/15 text-green-400">★ {outlet.rating}</span>
            <span className="pill bg-white/[0.06] text-ink-soft inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{outlet.eta}</span>
          </div>

          <p className="text-[15px] font-bold text-ink mt-6 mb-3">Menu</p>
          <div className="space-y-3">
            {outlet.menu.map((m) => (
              <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Veg veg={m.veg} />
                    <p className="text-[15px] font-bold text-ink truncate">{m.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-soft mt-1">₹{m.price}</p>
                  <p className="text-[12px] text-ink-mute mt-1 leading-snug">{m.desc}</p>
                </div>
                {cart[m.id] ? (
                  <div className="flex items-center gap-2 bg-white/[0.06] rounded-xl px-1.5 py-1 shrink-0">
                    <button onClick={() => removeFromCart(m.id)} className="w-7 h-7 rounded-lg bg-white/[0.06] text-ink font-bold active:scale-90 transition">−</button>
                    <span className="w-5 text-center text-sm font-bold text-ink">{cart[m.id]}</span>
                    <button onClick={() => addToCart(m.id)} className="w-7 h-7 rounded-lg brand-gradient text-white font-bold active:scale-90 transition">+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(m.id)} className="px-4 py-2 rounded-xl brand-gradient text-white text-sm font-bold active:scale-95 transition shrink-0">Add</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {cartCount > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md">
            <button
              onClick={() => { flash("Order placed! Pickup at counter — pay on collection."); setCart({}); setOutlet(null); }}
              className="w-full brand-gradient text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-lg shadow-brand-500/30 active:scale-[0.98] transition"
            >
              <span className="text-sm font-bold">{cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal}</span>
              <span className="text-sm font-extrabold">Place order →</span>
            </button>
          </div>
        )}
        {toast && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg animate-fade-up">{toast}</div>}
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="px-5 pt-12 pb-28">
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-ink">My Campus</h1>
        <p className="text-[13px] text-ink-mute mt-0.5">Everything about your campus — in one place.</p>
      </div>

      {/* section tabs */}
      <div className="flex gap-2 mt-5 mb-5 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => {
          const on = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => { setSection(s.key); setSearch(""); }}
              className={`shrink-0 px-3.5 py-2 rounded-full text-[13px] font-bold transition flex items-center gap-1.5 ${
                on ? "brand-gradient text-white shadow-md shadow-brand-500/25" : "bg-white/[0.05] border border-white/[0.07] text-ink-soft"
              }`}
            >
              <span>{s.emoji}</span>{s.label}
            </button>
          );
        })}
      </div>

      {/* ── FOOD / RESTAURANT ORDERING ── */}
      {section === "food" && (
        <>
          <div className="relative mb-5">
            <SearchIcon className="w-[18px] h-[18px] text-ink-mute absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className="input pl-10" placeholder="Search canteens & outlets" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <p className="text-[15px] font-bold text-ink mb-3">{outlets.length} outlets open on campus</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {outlets.map((o) => (
              <div key={o.id} onClick={() => setOutlet(o)} className="cursor-pointer active:scale-[0.99] transition">
                <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-white/[0.04]">
                  <SmartImg src={o.image} emoji="🍽️" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span className="absolute top-3 left-3 text-[11px] font-semibold text-white bg-black/45 backdrop-blur px-2.5 py-1 rounded-full inline-flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{o.eta}</span>
                  <p className="absolute bottom-3 left-4 text-white text-[19px] font-extrabold drop-shadow-lg">{o.name}</p>
                </div>
                <div className="pt-2.5 px-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "#1d9e54" }}>★ {o.rating}</span>
                  <p className="text-[13px] text-ink-mute truncate">{o.tag}</p>
                </div>
              </div>
            ))}
            {outlets.length === 0 && <div className="card p-8 text-center"><p className="text-sm text-ink-mute">No outlets found.</p></div>}
          </div>
        </>
      )}

      {/* ── OFFICIAL EVENTS (sellable / ticketed) ── */}
      {section === "events" && (
        <>
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-3.5 mb-4">
            <p className="text-[12px] text-brand-200 font-bold">🎟️ Official University Events</p>
            <p className="text-[11px] text-brand-300 mt-0.5 leading-snug">Passes for fests, ceremonies & official programs — book directly here.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OFFICIAL_EVENTS.map((e) => (
              <div key={e.id} className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0c0c0c]">
                <div className="relative aspect-[16/9] bg-white/[0.04]">
                  <SmartImg src={e.image} emoji="🎟️" />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent" />
                  <span className="absolute top-3 left-3 pill bg-brand-500 text-white">{e.tag}</span>
                  <p className="absolute bottom-3 left-3 text-white text-xl font-extrabold drop-shadow">{e.price > 0 ? `₹${e.price}` : "Free"}</p>
                </div>
                <div className="p-3.5">
                  <p className="text-[16px] font-bold text-ink leading-tight">{e.title}</p>
                  <p className="text-[12.5px] text-ink-mute mt-1">{e.date}</p>
                  <p className="text-[12.5px] text-ink-mute">{e.venue} · by {e.organiser}</p>
                  <p className="text-[11px] text-amber-400 font-semibold mt-1.5">{e.left} passes left</p>
                  <button onClick={() => setEvt(e)} className="btn-primary w-full mt-3 py-2.5 text-sm">{e.price > 0 ? "Get pass" : "Register"}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── DIRECTIONS (campus map) ── */}
      {section === "directions" && <CampusMap />}

      {/* ── CAMPUS INFO ── */}
      {section === "info" && (
        <div className="space-y-3">
          {CAMPUS_INFO.map((c, i) => (
            <a
              key={i}
              href={c.action || undefined}
              className={`card p-4 flex items-center gap-3.5 ${c.action ? "active:scale-[0.99] transition" : ""}`}
            >
              <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-xl shrink-0">{c.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink leading-tight">{c.label}</p>
                <p className="text-[12px] text-ink-mute mt-0.5 leading-snug">{c.value}</p>
              </div>
              {c.action && <span className="text-brand-300 text-[12px] font-bold shrink-0">Call</span>}
            </a>
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-ink-mute mt-7 leading-relaxed">
        Local-only preview. Outlets, events &amp; campus info are demo data. Live ordering &amp; pass payments come in v2.
      </p>

      {/* event pass sheet */}
      <Sheet open={!!evt} onClose={() => setEvt(null)} title="Book pass">
        {evt && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-white/[0.04]">
              <SmartImg src={evt.image} emoji="🎟️" />
            </div>
            <div>
              <p className="text-lg font-bold text-ink leading-tight">{evt.title}</p>
              <p className="text-[12.5px] text-ink-mute mt-1">{evt.date}</p>
              <p className="text-[12.5px] text-ink-mute">{evt.venue} · by {evt.organiser}</p>
            </div>
            <div className="card p-4 flex items-center justify-between">
              <span className="text-sm text-ink-soft">Pass price</span>
              <span className="text-xl font-extrabold text-ink">{evt.price > 0 ? `₹${evt.price}` : "Free"}</span>
            </div>
            <button
              onClick={() => { flash(evt.price > 0 ? "Pass booked! Payments go live in v2." : "You're registered! 🎉"); setEvt(null); }}
              className="btn-primary w-full py-3"
            >
              {evt.price > 0 ? `Pay ₹${evt.price} & book` : "Confirm registration"}
            </button>
          </div>
        )}
      </Sheet>

      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg animate-fade-up">{toast}</div>}
    </div>
  );
}
