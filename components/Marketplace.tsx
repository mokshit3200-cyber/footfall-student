"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "./store";
import { Sheet } from "./ui";
import { PlusIcon, TrashIcon, ChevronRight, SearchIcon, XIcon } from "./icons";
import { Listing, ListingCategory } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";

const CATEGORIES: { key: ListingCategory; label: string; emoji: string; color: string }[] = [
  { key: "food", label: "Food", emoji: "🍔", color: "#f59e0b" },
  { key: "tutoring", label: "Tutoring", emoji: "📚", color: "#3b82f6" },
  { key: "design", label: "Design", emoji: "🎨", color: "#ec4899" },
  { key: "products", label: "Products", emoji: "📦", color: "#8b5cf6" },
  { key: "services", label: "Services", emoji: "🛠️", color: "#7c3aed" },
  { key: "rentals", label: "Rentals", emoji: "🚲", color: "#06b6d4" },
  { key: "other", label: "Other", emoji: "⚡", color: "#ef4444" },
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

type VKey = "food" | "events" | "services" | "lending";
const VERTICALS: { key: VKey; label: string; emoji: string; cats: ListingCategory[]; note: string }[] = [
  { key: "food", label: "Food", emoji: "🍔", cats: ["food"], note: "Hostel delivery" },
  { key: "events", label: "Events", emoji: "🎟️", cats: [], note: "" },
  { key: "services", label: "Services", emoji: "🛠️", cats: ["tutoring", "design", "services", "other"], note: "Book a slot" },
  { key: "lending", label: "Lending", emoji: "🤝", cats: ["rentals", "products"], note: "Meet on campus" },
];

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=60`;

export const DEMO_LISTINGS: Listing[] = [
  { id: "demo-1", title: "Homemade Chicken Biryani", category: "food", price: 120, priceUnit: "plate", description: "Authentic home-cooked chicken biryani with premium basmati rice. Hostel delivery on Friday evenings.", seller: "Karan's Kitchen", contact: "+91 98765 43210", image: U("1563379091339-03b21ab4a4f8"), mine: false, createdAt: "" },
  { id: "demo-10", title: "Fresh Choco Chip Cookies", category: "food", price: 150, priceUnit: "box of 6", description: "Eggless, gooey cookies baked fresh every morning. Order 1 day ahead.", seller: "Cookies by Maya", contact: "cookies_by_maya", image: U("1499636136210-6f4ee915583e"), mine: false, createdAt: "" },
  { id: "demo-2", title: "Python & Data Science Tutoring", category: "tutoring", price: 300, priceUnit: "hour", description: "Help with Python, DBMS SQL, or Data Structures. 3rd-year CS student, online or library sessions.", seller: "Sneha Patel", contact: "sneha_codes", image: U("1526379095098-d400fd0bf935"), mine: false, createdAt: "" },
  { id: "demo-3", title: "Logo & UI/UX Design", category: "design", price: 1500, priceUnit: "project", description: "Custom logos, Instagram templates, and app UI/UX wireframes for student startups.", seller: "Rahul Varma", contact: "rahul_designs", image: U("1561070791-2526d30994b5"), mine: false, createdAt: "" },
  { id: "demo-6", title: "Hostel Room Cleaning", category: "services", price: 150, priceUnit: "clean", description: "Quick room cleaning — dusting, mopping, desk organising, garbage disposal.", seller: "Vicky Malhotra", contact: "clean_my_room", image: U("1581578731548-c64695cc6952"), mine: false, createdAt: "" },
  { id: "demo-7", title: "Placement Resume Review", category: "tutoring", price: 200, priceUnit: "review", description: "Placed at Microsoft. Resume review, structure tips, prep material + mock interviews.", seller: "Divya Teja", contact: "divya_review", image: U("1586281380349-632531db7ed4"), mine: false, createdAt: "" },
  { id: "demo-8", title: "Guitar Lessons for Beginners", category: "tutoring", price: 250, priceUnit: "hour", description: "Learn chords, scales & simple songs. Amphitheatre or online sessions.", seller: "Amit Sen", contact: "+91 99900 11122", image: U("1510915361894-db8b60106cb1"), mine: false, createdAt: "" },
  { id: "demo-5", title: "Chemistry Lab Coat (M)", category: "rentals", price: 50, priceUnit: "week", description: "White lab coat for chem/physics labs. Freshly washed, weekly rental.", seller: "Pooja Roy", contact: "+91 88888 77777", image: U("1532094349884-543bc11b234d"), mine: false, createdAt: "" },
  { id: "demo-11", title: "DSLR Camera Rent (Canon 200D)", category: "rentals", price: 500, priceUnit: "day", description: "For fests, outings & projects. 18-55mm lens + charger. Refundable deposit.", seller: "Kabir Mehta", contact: "+91 90000 80000", image: U("1502920917128-1aa500764cbd"), mine: false, createdAt: "" },
  { id: "demo-12", title: "Gear Cycle for Rent", category: "rentals", price: 100, priceUnit: "day", description: "18-speed Decathlon cycle for campus commuting. Helmet & lock included.", seller: "Preeti Kaur", contact: "+91 82222 33333", image: U("1485965120184-e220f721d03e"), mine: false, createdAt: "" },
  { id: "demo-4", title: "Engineering Drawing Kit", category: "products", price: 450, description: "Complete mini-drafter, T-square & compass set. Used one semester, perfect condition.", seller: "Aarav Sharma", contact: "+91 91234 56789", image: U("1581092160562-40aa08e78837"), mine: false, createdAt: "" },
  { id: "demo-9", title: "Scientific Calculator fx-991EX", category: "products", price: 800, description: "Solar powered, 552 functions, perfect condition. Original box included.", seller: "Rohan Das", contact: "+91 77777 66666", image: U("1587145820266-a5951ee6f620"), mine: false, createdAt: "" },
];

interface Ev { id: string; title: string; date: string; venue: string; price: number; tag: string; image: string; }
const EVENTS: Ev[] = [
  { id: "e1", title: "Sangam — Cultural Night", date: "Sat, 28 Jun · 6:00 PM", venue: "Main Auditorium", price: 99, tag: "Music", image: U("1470229722913-7c0e2dbbafd3") },
  { id: "e2", title: "HackFest 24h Hackathon", date: "Sat, 5 Jul · 9:00 AM", venue: "CS Block", price: 0, tag: "Tech", image: U("1504384308090-c894fdcc538d") },
  { id: "e3", title: "Standup Comedy Night", date: "Fri, 11 Jul · 7:30 PM", venue: "Open Air Theatre", price: 149, tag: "Comedy", image: U("1516450360452-9312f5e86fc7") },
  { id: "e4", title: "Inter-College Football Cup", date: "Sun, 13 Jul · 8:00 AM", venue: "Main Ground", price: 0, tag: "Sports", image: U("1431324155629-1a6deb1dec8d") },
  { id: "e5", title: "Photography Workshop", date: "Sat, 19 Jul · 11:00 AM", venue: "Design Studio", price: 200, tag: "Workshop", image: U("1452587925148-ce544e77e70d") },
  { id: "e6", title: "Fresher's Party 2026", date: "Sat, 26 Jul · 7:00 PM", venue: "Clubhouse", price: 299, tag: "Party", image: U("1492684223066-81342ee5ff30") },
];

function ratingOf(id: string) {
  let h = 0;
  for (const ch of id) h = ch.charCodeAt(0) + ((h << 5) - h);
  return (4 + (Math.abs(h) % 10) / 10).toFixed(1);
}

function SmartImg({ src, emoji, color }: { src?: string; emoji: string; color: string }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setErr(true)} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}40, ${color}12)` }}>
      <span className="text-5xl opacity-80">{emoji}</span>
    </div>
  );
}

const Heart = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill={on ? "#ec4899" : "none"} stroke={on ? "#ec4899" : "#fff"} strokeWidth="2">
    <path d="M12 20s-7-4.6-9.3-9C1.2 8 2.6 4.8 6 4.8c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.4 0 4.8 3.2 3.3 6.2C19 15.4 12 20 12 20z" strokeLinejoin="round" />
  </svg>
);
const Star = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3" fill="#fff"><path d="M12 2l2.9 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.3 5.9 20.6l1.5-6.7L2.3 8.9l6.8-.6z" /></svg>
);

const priceLabel = (l: Listing) => (l.price > 0 ? `₹${l.price}${l.priceUnit ? ` / ${l.priceUnit}` : ""}` : "Contact for price");

function LiveListingSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("food");
  const [price, setPrice] = useState("");
  const [contactForPrice, setContactForPrice] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory("food");
      setPrice("");
      setContactForPrice(false);
      setDescription("");
      setImage("");
    }
  }, [open]);

  async function pick(f?: File) {
    if (!f) return;
    try {
      setImage(await fileToDataUrl(f));
    } catch {}
  }

  async function save() {
    if (!title.trim() || !description.trim() || !user || !profile?.college) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: contactForPrice ? 0 : Number(price) || 0,
        category,
        image_url: image || null,
        college: profile.college,
        active: true,
      });

      if (error) {
        console.error(error);
        alert("Failed to post listing: " + error.message);
      } else {
        onSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New listing">
      <div className="space-y-4">
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {image ? (
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <img src={image} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setImage("")}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-ink-mute active:bg-white/[0.04] transition"
            >
              <PlusIcon className="w-7 h-7 mb-1" />
              <span className="text-sm font-semibold">Add a photo</span>
              <span className="text-[11px]">Listings with photos sell faster</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition ${
                category === c.key ? "ring-2" : "bg-white/[0.05]"
              }`}
              style={category === c.key ? { background: c.color + "1f", boxShadow: `0 0 0 2px ${c.color}` } : {}}
            >
              <span className="text-lg">{c.emoji}</span>
              <span className="text-[10px] font-semibold text-ink-soft">{c.label}</span>
            </button>
          ))}
        </div>

        <input
          className="input text-sm"
          placeholder="What are you offering?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide">Price</label>
            <button
              onClick={() => setContactForPrice((v) => !v)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                contactForPrice ? "bg-brand-500 text-white" : "bg-white/[0.07] text-ink-soft"
              }`}
            >
              Contact for price
            </button>
          </div>
          {!contactForPrice && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute font-semibold">₹</span>
              <input
                type="number"
                inputMode="numeric"
                className="input pl-7 text-sm"
                placeholder="250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          )}
        </div>

        <textarea
          className="input w-full min-h-[90px] text-sm resize-none"
          placeholder="Details, delivery, availability…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          onClick={save}
          disabled={saving || !title.trim() || !description.trim()}
          className="btn-primary w-full py-3 disabled:opacity-40"
        >
          {saving ? "Posting..." : "Post listing"}
        </button>
      </div>
    </Sheet>
  );
}

function LiveMarketplace({ onSwitchTab }: { onSwitchTab?: (tab: any) => void }) {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sel, setSel] = useState<any | null>(null);

  async function fetchListings() {
    if (!profile?.college) return;
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles(name, username)")
        .eq("college", profile.college)
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
      } else if (data) {
        setListings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
  }, [profile]);

  if (loading) {
    return (
      <div className="px-5 pt-12 pb-28 min-h-screen no-scrollbar animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ink">Marketplace</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl p-4 h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen no-scrollbar animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-ink">Marketplace</h2>
        <button
          onClick={() => setSheetOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white rounded-2xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" /> Post Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="card p-8 text-center bg-[#0c0c0e]/90 border border-white/[0.07] rounded-3xl mt-4">
          <p className="text-sm font-semibold text-ink mb-1">No listings yet</p>
          <p className="text-xs text-ink-mute">Be the first to post something in your college!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {listings.map((item) => {
            const cat = CATEGORIES.find((c) => c.key === item.category) || CATEGORIES[6];
            return (
              <div
                key={item.id}
                onClick={() => setSel(item)}
                className="bg-[#0c0c0e]/90 border border-white/[0.07] hover:border-white/15 transition duration-200 rounded-3xl overflow-hidden cursor-pointer flex flex-col h-full"
              >
                <div className="relative aspect-[16/10] bg-white/[0.03] flex-shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${cat.color}40, ${cat.color}12)` }}
                    >
                      <span className="text-4xl opacity-80">{cat.emoji}</span>
                    </div>
                  )}
                  <span
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.label}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col justify-between flex-grow min-w-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-extrabold truncate">
                      ₹{item.price > 0 ? item.price : "Contact"}
                    </p>
                    <p className="text-xs font-bold text-ink mt-1 truncate">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-[10px] text-ink-mute mt-2 truncate">
                    {item.profiles?.name || "Student"} • @{item.profiles?.username || "user"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LiveListingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={() => {
          setSheetOpen(false);
          fetchListings();
        }}
      />

      {sel && (
        <Sheet open={!!sel} onClose={() => setSel(null)} title="Listing Details">
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-white/[0.03]">
              {sel.image_url ? (
                <img src={sel.image_url} alt={sel.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/[0.05]">
                  <span className="text-6xl">{CATEGORIES.find((c) => c.key === sel.category)?.emoji || "📦"}</span>
                </div>
              )}
            </div>

            <div>
              <span className="inline-block text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full uppercase">
                {CATEGORIES.find((c) => c.key === sel.category)?.label || sel.category}
              </span>
              <h3 className="text-lg font-bold text-ink mt-2">{sel.title}</h3>
              <p className="text-xl font-black text-brand-300 mt-1">₹{sel.price > 0 ? sel.price : "Contact for price"}</p>
            </div>

            <div className="border-t border-white/5 pt-3">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-1">Description</label>
              <p className="text-xs text-ink-mute leading-relaxed whitespace-pre-wrap">{sel.description}</p>
            </div>

            <div className="border-t border-white/5 pt-3">
              <label className="text-[10px] font-bold text-ink-soft uppercase tracking-wide block mb-1">Seller</label>
              <p className="text-xs font-bold text-ink">{sel.profiles?.name || "Student"}</p>
              {sel.profiles?.username && (
                <p className="text-xs text-brand-300">@{sel.profiles.username}</p>
              )}
            </div>

            {user?.id !== sel.user_id && (
              <button
                onClick={() => {
                  setSel(null);
                  if (onSwitchTab) onSwitchTab("connect");
                }}
                className="btn-primary w-full py-3"
              >
                Chat with Seller 💬
              </button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

export default function Marketplace({ onSwitchTab }: { onSwitchTab?: (tab: any) => void }) {
  if (!isDemo()) {
    return <LiveMarketplace onSwitchTab={onSwitchTab} />;
  }
  const { data, update, uid } = useStore();
  const [vert, setVert] = useState<VKey>("food");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<Listing | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [reveal, setReveal] = useState(false);
  const [fav, setFav] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");
  const [offerSheetOpen, setOfferSheetOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [offerListing, setOfferListing] = useState<Listing | null>(null);
  const [offersSheetOpen, setOffersSheetOpen] = useState(false);
  const [offersTab, setOffersTab] = useState<"outbound" | "inbound">("outbound");

  // Pull-to-sync state
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Loading skeleton state for vertical tab changes
  const [isLoading, setIsLoading] = useState(false);

  // Handle touch gestures for pull-to-sync
  function handleTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0 && !isSyncing) {
      setPullStart(e.touches[0].clientY);
    }
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (pullStart === null || isSyncing) return;
    const diff = e.touches[0].clientY - pullStart;
    if (diff > 0) {
      if (e.cancelable) e.preventDefault();
      setPullOffset(Math.min(70, diff * 0.45));
    }
  }
  function handleTouchEnd() {
    if (pullStart === null || isSyncing) return;
    setPullStart(null);
    if (pullOffset > 45) {
      setIsSyncing(true);
      setPullOffset(50);
      // Simulate sync action
      setTimeout(() => {
        setIsSyncing(false);
        setPullOffset(0);
        // Show temporary toast
        const t = document.createElement('div');
        t.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-xs font-bold px-4 py-2.5 rounded-full shadow-lg animate-fade-up';
        t.innerText = '⚡ Marketplace Synced!';
        document.body.appendChild(t);
        setTimeout(() => { t.classList.add('animate-fade-out'); setTimeout(() => { if (t.parentNode) document.body.removeChild(t); }, 300); }, 1500);
      }, 1200);
    } else {
      setPullOffset(0);
    }
  }

  // Trigger loading skeleton on vertical tab change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [vert]);

  function openOfferSheet() {
    if (!sel) return;
    setOfferListing(sel);
    setOfferPrice(sel.price > 0 ? String(sel.price) : "");
    setOfferMessage(
      sel.price > 0
        ? `Proposed Offer: ₹${sel.price} for "${sel.title}". Hey, is this still available and can we negotiate?`
        : `Interested in "${sel.title}". Hey, is this still available?`
    );
    setOfferSheetOpen(true);
  }

  function handleSendOffer() {
    if (!offerListing || !onSwitchTab) return;
    const sellerName = offerListing.seller;
    const finalPrice = Number(offerPrice) || 0;

    // Check or generate DM request chat ID
    const existingChat = data.groups.find((g) => g.direct && g.members.includes(sellerName));
    const chatId = existingChat ? existingChat.id : uid();

    update((d) => {
      let chat = d.groups.find((g) => g.id === chatId);
      if (!chat) {
        chat = {
          id: chatId,
          name: sellerName,
          members: [sellerName],
          tasks: [],
          notes: "",
          createdAt: new Date().toISOString(),
          messages: [],
          direct: true,
          isRequest: true, // Marked as request same as Instagram!
        };
        d.groups.push(chat);
      } else {
        chat.isRequest = true;
      }

      chat.messages = chat.messages || [];
      chat.messages.push({
        id: uid(),
        sender: "me",
        text: offerMessage.trim() || `Proposed Offer: ₹${finalPrice} for ${offerListing.title}`,
        at: new Date().toISOString(),
      });
    });

    localStorage.setItem("footfall-active-chat-id", chatId);
    localStorage.setItem("footfall-connect-tab", "requests");

    setOfferSheetOpen(false);
    setSel(null); // Return to main marketplace view

    flash("Offer sent to requests! Redirecting...");
    setTimeout(() => {
      onSwitchTab("connect");
    }, 800);
  }

  const all = useMemo(
    () => [...(data.listings || []).map((l) => ({ ...l, mine: true })), ...DEMO_LISTINGS],
    [data.listings]
  );
  const vcfg = VERTICALS.find((v) => v.key === vert)!;
  const filtered = useMemo(() => {
    if (vert === "events") return [];
    const q = search.toLowerCase();
    return all.filter((it) => vcfg.cats.includes(it.category) && (it.title.toLowerCase().includes(q) || it.seller.toLowerCase().includes(q)));
  }, [all, vert, search, vcfg]);
  const events = useMemo(() => {
    const q = search.toLowerCase();
    return EVENTS.filter((e) => e.title.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q));
  }, [search]);

  function del(id: string) {
    if (!confirm("Delete this listing?")) return;
    update((d) => { d.listings = d.listings.filter((l) => l.id !== id); });
    setSel(null);
  }
  function flash(m: string) { setToast(m); setTimeout(() => setToast(""), 1800); }

  /* ── DETAIL ── */
  if (sel) {
    const c = CAT_MAP[sel.category];
    const isPhone = sel.contact && /^[+\d][\d\s]+$/.test(sel.contact);
    return (
      <div className="min-h-screen pb-28">
        <div className="relative">
          <div className="aspect-[4/3] md:aspect-[16/9] bg-white/[0.04] overflow-hidden">
            <SmartImg src={sel.image} emoji={c.emoji} color={c.color} />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
          <button onClick={() => setSel(null)} className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-white"><ChevronRight className="w-5 h-5 rotate-180" /></button>
          {sel.mine && (
            <div className="absolute top-12 right-4 flex gap-2">
              <button onClick={() => { setEditing(sel); setSheetOpen(true); }} className="px-3 py-2 rounded-full bg-black/55 backdrop-blur text-white text-xs font-semibold">Edit</button>
              <button onClick={() => del(sel.id)} className="w-9 h-9 rounded-full bg-black/55 backdrop-blur flex items-center justify-center text-red-400"><TrashIcon className="w-4 h-4" /></button>
            </div>
          )}
        </div>
        <div className="px-5 -mt-4 relative md:max-w-2xl md:mx-auto">
          <p className="text-3xl font-extrabold text-ink">{priceLabel(sel)}</p>
          <h1 className="text-lg font-semibold text-ink mt-1 leading-snug">{sel.title}</h1>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-white px-2 py-1 rounded-md" style={{ background: "#1d9e54" }}><Star />{ratingOf(sel.id)}</span>
            <span className="pill" style={{ background: c.color + "22", color: c.color }}>{c.emoji} {c.label}</span>
            <span className={`pill ${sel.mine ? "bg-brand-500/15 text-brand-300" : "bg-white/[0.07] text-ink-mute"}`}>{sel.mine ? "Your listing" : "Sample"}</span>
          </div>
          <div className="card p-4 mt-5"><p className="text-[11px] font-bold text-ink-mute uppercase tracking-wide mb-1">Description</p><p className="text-sm text-ink-soft leading-relaxed">{sel.description}</p></div>
          <div className="flex items-center gap-3 mt-4">
            <div className="w-10 h-10 rounded-full bg-white/[0.07] flex items-center justify-center text-ink font-bold">{sel.seller[0]?.toUpperCase()}</div>
            <div className="flex-1"><p className="text-sm font-semibold text-ink">{sel.seller}</p><p className="text-[11px] text-ink-mute">Seller</p></div>
          </div>
          <div className="mt-5 space-y-2.5">
            {!sel.mine && onSwitchTab && (
              <button
                onClick={() => openOfferSheet()}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold active:scale-95 transition shadow-md shadow-brand-500/25 flex items-center justify-center gap-1.5"
              >
                🤝 Make an Offer / Negotiate
              </button>
            )}
            {!reveal ? <button onClick={() => setReveal(true)} className="btn-primary w-full bg-white/[0.06] hover:bg-white/[0.1] text-ink border border-white/[0.08]">Show contact</button> : (
              <div className="card p-4 text-center">
                <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wide mb-1">Contact</p>
                {isPhone ? <a href={`tel:${sel.contact}`} className="text-xl font-bold text-brand-300">{sel.contact}</a> : <p className="text-xl font-bold text-brand-300">@{sel.contact}</p>}
                <p className="text-[10px] text-ink-mute mt-1.5">{sel.mine ? "Buyers reach you here." : "Sample listing — for demo only."}</p>
              </div>
            )}
          </div>
        </div>
        <ListingSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setEditing(null); }} listing={editing} onSaved={setSel} />
        <OffersTrackerSheet open={offersSheetOpen} onClose={() => setOffersSheetOpen(false)} onSwitchTab={onSwitchTab} />
      </div>
    );
  }

  /* ── MAIN ── */
  return (
    <div className="px-5 pt-12 pb-28">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-ink">Marketplace</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffersSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-bold text-ink-soft active:scale-95 transition"
          >
            <span>📦</span> Your Offers
          </button>
          <button onClick={() => { setEditing(null); setSheetOpen(true); }} className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white active:scale-95 transition shadow-md shadow-brand-500/25"><PlusIcon className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Swiggy-style tab bar */}
      {/* Loading indicator for tab change */}
      {isLoading && (
        <div className="flex gap-2 mb-5 animate-pulse">
          {VERTICALS.map((v) => (
            <div key={v.key} className="flex-1 h-10 bg-white/[0.05] rounded-xl" />
          ))}
        </div>
      )}
      <div className="flex gap-2 mb-5">
        {VERTICALS.map((v) => {
          const on = vert === v.key;
          return (
            <button key={v.key} onClick={() => { setVert(v.key); setSearch(""); }} className="flex-1 flex flex-col items-center active:scale-95 transition">
              <div className={`w-full aspect-square rounded-2xl flex items-center justify-center text-[26px] transition-all ${on ? "brand-gradient shadow-lg shadow-brand-500/30 scale-[1.02]" : "bg-white/[0.05] border border-white/[0.07]"}`}>
                <span style={{ filter: on ? "none" : "grayscale(0.1)" }}>{v.emoji}</span>
              </div>
              <span className={`text-[12px] mt-1.5 ${on ? "text-ink font-bold" : "text-ink-mute font-medium"}`}>{v.label}</span>
              <span className={`mt-1 h-[3px] rounded-full transition-all ${on ? "w-5 bg-brand-400" : "w-0 bg-transparent"}`} />
            </button>
          );
        })}
      </div>

      {/* search & listings layout */}
      {(
        <>
          {/* search */}
          <div className="relative mb-5">
            <SearchIcon className="w-[18px] h-[18px] text-ink-mute absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className="input pl-10" placeholder={vert === "events" ? "Search events" : `Search ${vcfg.label.toLowerCase()}`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <p className="text-[15px] font-bold text-ink mb-3">
            {vert === "events" ? `${events.length} events on campus` : `${filtered.length} ${vcfg.label.toLowerCase()} listings near you`}
          </p>

          {/* EVENTS */}
          {vert === "events" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((e) => (
                <div key={e.id} className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0c0c0c]">
                  <div className="relative aspect-[16/9] bg-white/[0.04]">
                    <SmartImg src={e.image} emoji="🎟️" color="#7c3aed" />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 to-transparent" />
                    <span className="absolute top-3 left-3 pill bg-black/55 backdrop-blur text-white">{e.tag}</span>
                    <p className="absolute bottom-3 left-3 text-white text-xl font-extrabold drop-shadow">{e.price > 0 ? `₹${e.price}` : "Free"}</p>
                  </div>
                  <div className="p-3.5">
                    <p className="text-[16px] font-bold text-ink leading-tight">{e.title}</p>
                    <p className="text-[12.5px] text-ink-mute mt-1">{e.date}</p>
                    <p className="text-[12.5px] text-ink-mute">{e.venue}</p>
                    <button onClick={() => flash("Passes open in v2 — coming soon")} className="btn-primary w-full mt-3 py-2.5 text-sm">Get pass</button>
                  </div>
                </div>
              ))}
              {events.length === 0 && <div className="card p-8 text-center"><p className="text-sm text-ink-mute">No events found.</p></div>}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-sm font-semibold text-ink mb-1">Nothing here yet</p><p className="text-xs text-ink-mute">Try a different search, or tap + to post.</p></div>
          ) : (
            /* SWIGGY-STYLE LISTING CARDS */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((it) => {
                const c = CAT_MAP[it.category];
                return (
                  <div key={it.id} onClick={() => { setSel(it); setReveal(false); }} className="cursor-pointer active:scale-[0.99] transition">
                    <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-white/[0.04]">
                      <SmartImg src={it.image} emoji={c.emoji} color={c.color} />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <button
                        onClick={(e) => { e.stopPropagation(); setFav((f) => ({ ...f, [it.id]: !f[it.id] })); }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center active:scale-90 transition"
                      >
                        <Heart on={!!fav[it.id]} />
                      </button>
                      {it.mine && <span className="absolute top-3 left-3 text-[10px] font-bold bg-brand-500 text-white px-2.5 py-1 rounded-full">Yours</span>}
                      <p className="absolute bottom-3 left-4 text-white text-[19px] font-extrabold drop-shadow-lg">{priceLabel(it)}</p>
                      {vcfg.note && <span className="absolute bottom-3.5 right-3 text-[11px] font-semibold text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-full">{vcfg.note}</span>}
                    </div>
                    <div className="pt-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[17px] font-bold text-ink truncate flex-1">{it.title}</p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-1.5 py-0.5 rounded-md shrink-0" style={{ background: "#1d9e54" }}><Star />{ratingOf(it.id)}</span>
                      </div>
                      <p className="text-[13px] text-ink-mute mt-0.5 truncate">{c.emoji} {c.label} · {it.seller}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="text-center text-[10px] text-ink-mute mt-7 leading-relaxed">
        Local-only preview. &quot;Sample&quot; items &amp; events are demo data. Your posts save to your device. Real networking &amp; passes come in v2.
      </p>

      {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg animate-fade-up">{toast}</div>}
      <ListingSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setEditing(null); }} listing={editing} onSaved={setSel} />

      {/* MAKE OFFER / NEGOTIATION SHEET */}
      <Sheet open={offerSheetOpen} onClose={() => setOfferSheetOpen(false)} title="Proposed Offer">
        <div className="space-y-4">
          <p className="text-xs text-ink-mute leading-relaxed">
            Propose an offer price to negotiate with the seller. Your negotiation message will go to their DM Requests.
          </p>

          <div>
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
              Proposed Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink font-semibold text-xs">₹</span>
              <input
                type="number"
                inputMode="numeric"
                className="input pl-7 text-sm"
                placeholder="Offer price..."
                value={offerPrice}
                onChange={(e) => {
                  setOfferPrice(e.target.value);
                  const newPrice = e.target.value;
                  setOfferMessage(
                    newPrice
                      ? `Proposed Offer: ₹${newPrice} for "${offerListing?.title}". Hey, is this still available and can we negotiate?`
                      : `Interested in "${offerListing?.title}". Hey, is this still available?`
                  );
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
              Message to Seller
            </label>
            <textarea
              className="input w-full min-h-[100px] text-xs resize-none"
              placeholder="Type your negotiation message..."
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
            />
          </div>

          <button
            onClick={handleSendOffer}
            disabled={!offerMessage.trim()}
            className="btn-primary w-full py-3 mt-2 disabled:opacity-40"
          >
            Send Offer 🤝
          </button>
        </div>
      </Sheet>
    </div>
  );
}

/* resize uploaded image to small base64 jpeg */
function fileToDataUrl(file: File, max = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ListingSheet({ open, onClose, listing, onSaved }: { open: boolean; onClose: () => void; listing: Listing | null; onSaved: (l: Listing) => void; }) {
  const { data, update, uid } = useStore();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ListingCategory>("food");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [contactForPrice, setContactForPrice] = useState(false);
  const [description, setDescription] = useState("");
  const [seller, setSeller] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"phone" | "whatsapp" | "insta">("phone");
  const [image, setImage] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (listing) {
      setTitle(listing.title); setCategory(listing.category);
      setPrice(listing.price > 0 ? String(listing.price) : ""); setPriceUnit(listing.priceUnit || "");
      setContactForPrice(listing.price === 0); setDescription(listing.description);
      setSeller(listing.seller); setContact(listing.contact || ""); setImage(listing.image || "");
    } else {
      setTitle(""); setCategory("food"); setPrice(""); setPriceUnit(""); setContactForPrice(false);
      setDescription(""); setSeller(data.profile?.name || ""); setContact(""); setImage("");
    }
  }, [open, listing, data.profile]);

  async function pick(f?: File) { if (!f) return; try { setImage(await fileToDataUrl(f)); } catch {} }

  function save() {
    if (!title.trim() || !description.trim()) return;
    const item: Listing = {
      id: listing?.id || uid(), title: title.trim(), category,
      price: contactForPrice ? 0 : Number(price) || 0,
      priceUnit: contactForPrice ? undefined : priceUnit.trim() || undefined,
      description: description.trim(), seller: seller.trim() || data.profile?.name || "Student",
      contact: contact.trim() || undefined, image: image || undefined, mine: true,
      createdAt: listing?.createdAt || new Date().toISOString(),
    };
    update((d) => { if (!d.listings) d.listings = []; const i = d.listings.findIndex((l) => l.id === item.id); if (i >= 0) d.listings[i] = item; else d.listings.push(item); });
    onClose(); onSaved(item);
  }

  return (
    <Sheet open={open} onClose={onClose} title={listing ? "Edit listing" : "New listing"}>
      <div className="space-y-4">
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {image ? (
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="preview" className="w-full h-full object-cover" />
              <button onClick={() => setImage("")} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white"><XIcon className="w-4 h-4" /></button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-ink-mute active:bg-white/[0.04] transition">
              <PlusIcon className="w-7 h-7 mb-1" /><span className="text-sm font-semibold">Add a photo</span><span className="text-[11px]">Listings with photos sell faster</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl transition ${category === c.key ? "ring-2" : "bg-white/[0.05]"}`} style={category === c.key ? { background: c.color + "1f", boxShadow: `0 0 0 2px ${c.color}` } : {}}>
              <span className="text-lg">{c.emoji}</span><span className="text-[10px] font-semibold text-ink-soft">{c.label}</span>
            </button>
          ))}
        </div>
        <input className="input" placeholder="What are you offering?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide">Price</label>
            <button onClick={() => setContactForPrice((v) => !v)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${contactForPrice ? "bg-brand-500 text-white" : "bg-white/[0.07] text-ink-soft"}`}>Contact for price</button>
          </div>
          {!contactForPrice && (
            <div className="flex gap-2">
              <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute font-semibold">₹</span><input type="number" inputMode="numeric" className="input pl-7" placeholder="250" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              <input className="input flex-1" placeholder="per plate / hour" value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} />
            </div>
          )}
        </div>
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1.5">How to reach you</label>
          <div className="flex gap-1.5 mb-2">
            {([["phone", "Phone"], ["whatsapp", "WhatsApp"], ["insta", "Instagram"]] as const).map(([t, l]) => (
              <button key={t} onClick={() => setContactType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${contactType === t ? "bg-brand-500 text-white" : "bg-white/[0.07] text-ink-soft"}`}>{l}</button>
            ))}
          </div>
          <input className="input" placeholder={contactType === "insta" ? "your_handle" : "+91 99999 88888"} value={contact} onChange={(e) => setContact(e.target.value)} />
        </div>
        <textarea className="input w-full min-h-[90px] resize-none" placeholder="Details, delivery, availability…" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button onClick={save} disabled={!title.trim() || !description.trim()} className="btn-primary w-full py-3 disabled:opacity-40">{listing ? "Save changes" : "Post listing"}</button>
      </div>
    </Sheet>
  );
}

function OffersTrackerSheet({
  open,
  onClose,
  onSwitchTab,
}: {
  open: boolean;
  onClose: () => void;
  onSwitchTab?: (tab: any) => void;
}) {
  const { data, update } = useStore();
  const [tab, setTab] = useState<"outbound" | "inbound">("outbound");

  const offers = useMemo(() => {
    const list = data.groups.filter((g) => g.direct && g.isRequest !== undefined);
    
    const outbound: any[] = [];
    const inbound: any[] = [];

    list.forEach((g) => {
      const firstMsg = g.messages?.[0];
      if (!firstMsg) return;

      const isOutbound = firstMsg.sender === "me";
      const offerItem = {
        chatId: g.id,
        partnerName: g.name,
        message: firstMsg.text,
        status: g.isRequest ? "Pending" : "Accepted",
        date: firstMsg.at,
      };

      if (isOutbound) {
        outbound.push(offerItem);
      } else {
        inbound.push(offerItem);
      }
    });

    return { outbound, inbound };
  }, [data.groups]);

  function handleAction(chatId: string, status: "accept" | "decline") {
    update((d) => {
      const g = d.groups.find((x) => x.id === chatId);
      if (g) {
        if (status === "accept") {
          g.isRequest = false; // Move to active DMs
        } else {
          // delete request chat
          d.groups = d.groups.filter((x) => x.id !== chatId);
        }
      }
    });
  }

  function handleViewChat(chatId: string) {
    localStorage.setItem("footfall-connect-tab", "requests");
    localStorage.setItem("footfall-active-chat-id", chatId);
    if (onSwitchTab) onSwitchTab("connect");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="📦 Offer Negotiations">
      {/* Sub-tabs */}
      <div className="flex gap-1.5 bg-black/[0.04] p-1 rounded-2xl text-xs font-bold mb-4">
        <button
          onClick={() => setTab("outbound")}
          className={`flex-1 py-2 rounded-xl transition ${
            tab === "outbound" ? "bg-white/10 text-ink" : "text-ink-mute"
          }`}
        >
          Outbound ({offers.outbound.length})
        </button>
        <button
          onClick={() => setTab("inbound")}
          className={`flex-1 py-2 rounded-xl transition ${
            tab === "inbound" ? "bg-white/10 text-ink" : "text-ink-mute"
          }`}
        >
          Inbound ({offers.inbound.length})
        </button>
      </div>

      {/* Offers list */}
      {(() => {
        const list = tab === "outbound" ? offers.outbound : offers.inbound;
        if (list.length === 0) {
          return (
            <div className="py-12 text-center">
              <span className="text-3xl">📦</span>
              <p className="text-sm text-ink-mute mt-2">No offers in this section.</p>
            </div>
          );
        }
        return (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-6">
            {list.map((o) => (
              <div
                key={o.chatId}
                className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-ink">
                      {tab === "outbound" ? `Offer to ${o.partnerName}` : `Offer from ${o.partnerName}`}
                    </p>
                    <p className="text-[10px] text-ink-mute mt-0.5">
                      {new Date(o.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      o.status === "Pending"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        : "bg-green-500/10 border border-green-500/20 text-green-400"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>

                <p className="text-xs text-ink-soft bg-black/20 p-2.5 rounded-xl font-medium leading-normal border border-white/5 whitespace-pre-line">
                  {o.message}
                </p>

                <div className="flex gap-2 justify-end mt-1">
                  {tab === "inbound" && o.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleAction(o.chatId, "decline")}
                        className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-400 text-[10px] font-bold active:scale-95 transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleAction(o.chatId, "accept")}
                        className="px-3 py-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-bold active:scale-95 transition"
                      >
                        Accept
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleViewChat(o.chatId)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold active:scale-95 transition"
                  >
                    View Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </Sheet>
  );
}
