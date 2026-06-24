"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "./store";
import {
  todayISO,
  thisMonth,
  prettyMonth,
  shiftMonth,
  daysInMonth,
  dayLabel,
} from "@/lib/dates";
import { Sheet, Ring } from "./ui";
import { PlusIcon, TrashIcon, ChevronRight, GearIcon, ArrowUpIcon, ArrowDownIcon, EditIcon } from "./icons";
import { ExpenseCategory, Expense, SplitBill } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { isDemo } from "@/lib/config";
import { dbSaveExpense, dbDeleteExpense, dbSaveSplit, dbDeleteSplit } from "@/lib/dbActions";

export const CATS: {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "food", label: "Food", emoji: "🍔", color: "#f59e0b" },
  { key: "travel", label: "Travel", emoji: "🚌", color: "#3b82f6" },
  { key: "fun", label: "Fun", emoji: "🎉", color: "#ec4899" },
  { key: "books", label: "Books", emoji: "📚", color: "#14b8a6" },
  { key: "other", label: "Other", emoji: "💸", color: "#64748b" },
];
const CAT_MAP = Object.fromEntries(CATS.map((c) => [c.key, c]));

export default function Money() {
  const { data, update, uid } = useStore();
  const { user } = useAuth();
  const { expenses, splits, profile, classmates } = data;
  const [month, setMonth] = useState(thisMonth());
  const [sheet, setSheet] = useState<null | "add" | "budget" | "split">(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingSplit, setEditingSplit] = useState<SplitBill | null>(null);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, month]
  );

  const total = useMemo(
    () => monthExpenses.reduce((a, e) => a + e.amount, 0),
    [monthExpenses]
  );

  const byCat = useMemo(() => {
    const m: Record<string, number> = {};
    monthExpenses.forEach((e) => (m[e.category] = (m[e.category] || 0) + e.amount));
    return m;
  }, [monthExpenses]);

  const budget = profile.monthlyBudget;
  const remaining = budget - total;
  const budgetPct = budget > 0 ? (total / budget) * 100 : 0;
  const over = budget > 0 && total > budget;

  const isCurrentMonth = month === thisMonth();
  const dim = daysInMonth(month);
  const dayOfMonth = isCurrentMonth ? new Date().getDate() : dim;
  const avgPerDay = dayOfMonth > 0 ? total / dayOfMonth : 0;

  const followedClassmates = useMemo(
    () => (classmates || []).filter((c) => c.followed),
    [classmates]
  );

  const grouped = useMemo(() => {
    const g: Record<string, typeof monthExpenses> = {};
    monthExpenses.forEach((e) => {
      (g[e.date] = g[e.date] || []).push(e);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthExpenses]);

  // ── FULL PANEL ─────────────────────────────────────────────────────────
  return (
    <div className="pb-28">
      {/* Compact wallet header */}
      <div
        style={{ background: "linear-gradient(135deg, #0f0320 0%, #2d0a6e 45%, #7c3aed 100%)" }}
        className="px-5 pt-12 pb-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {profile.name?.[0]?.toUpperCase() || "S"}
            </div>
            <span className="text-white/75 text-[14px] font-semibold">{profile.name || "Student"}</span>
          </div>
          <button onClick={() => setSheet("budget")} className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center active:bg-white/20 transition">
            <GearIcon className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">
              {budget > 0 ? (over ? "Over Budget" : "Remaining") : "Spent This Month"}
            </p>
            <p className="text-3xl font-black text-white tabular-nums leading-none">
              ₹{(budget > 0 ? Math.abs(remaining) : total).toLocaleString("en-IN")}
            </p>
            {budget > 0 && (
              <p className="text-white/35 text-[11px] mt-1">₹{total.toLocaleString("en-IN")} of ₹{budget.toLocaleString("en-IN")}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSheet("add")} className="h-9 px-3.5 rounded-xl bg-white/[0.12] border border-white/15 text-white text-xs font-bold flex items-center gap-1 active:bg-white/20 transition">
              <ArrowDownIcon className="w-3.5 h-3.5" /> Add
            </button>
            <button onClick={() => setSheet("split")} className="h-9 px-3.5 rounded-xl bg-white text-purple-900 text-xs font-bold flex items-center gap-1 active:scale-95 transition shadow">
              Split <ArrowUpIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        {/* Month switcher */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-[15px] font-bold text-ink">Breakdown</p>
          <div className="flex items-center gap-1 bg-[#0e0e0e] rounded-full border border-white/10 px-1 py-1">
            <button
              onClick={() => setMonth((m) => shiftMonth(m, -1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute active:bg-white/10"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="text-xs font-semibold text-ink-soft px-1 min-w-[84px] text-center">
              {prettyMonth(month)}
            </span>
            <button
              disabled={isCurrentMonth}
              onClick={() => setMonth((m) => shiftMonth(m, 1))}
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-mute active:bg-white/10 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSheet("add")}
            className="flex-1 btn-primary flex items-center justify-center gap-1.5 py-2.5"
          >
            <PlusIcon className="w-4 h-4" /> Add Expense
          </button>
          <button
            onClick={() => setSheet("split")}
            className="flex-1 btn-ghost flex items-center justify-center gap-1.5 py-2.5"
          >
            🧾 Split Bill
          </button>
        </div>

        {/* Category breakdown */}
        {total > 0 && (
          <>
            <p className="text-[13px] font-bold text-ink-mute uppercase tracking-wide mb-3">Where it went</p>
            <div className="card p-4 space-y-3 mb-6">
              <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/10 mb-1">
                <Insight label="Per day" value={`₹${Math.round(avgPerDay)}`} />
                <Insight
                  label="Top spend"
                  value={
                    Object.keys(byCat).length
                      ? CAT_MAP[Object.entries(byCat).sort((a, b) => b[1] - a[1])[0][0]].emoji
                      : "—"
                  }
                />
                <Insight label="Entries" value={String(monthExpenses.length)} />
              </div>
              {CATS.filter((c) => byCat[c.key]).map((c) => {
                const pct = (byCat[c.key] / total) * 100;
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-ink-soft font-medium">{c.emoji} {c.label}</span>
                      <span className="text-ink font-semibold">
                        ₹{byCat[c.key]} <span className="text-ink-mute font-normal">({Math.round(pct)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: pct + "%", background: c.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Transactions */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[15px] font-bold text-ink">Transactions</p>
          {budget > 0 && (
            <button onClick={() => setSheet("budget")} className="text-brand-300 text-xs font-semibold">
              Edit budget
            </button>
          )}
        </div>
        {grouped.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-ink-mute text-sm">No expenses in {prettyMonth(month)}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wide mb-1.5 px-1">
                  {dayLabel(date)}
                </p>
                <div className="card divide-y divide-white/10">
                  {items.map((e) => {
                    const c = CAT_MAP[e.category];
                    return (
                      <div key={e.id} className="flex items-center gap-3 p-3.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: c.color + "1a" }}>
                          {c.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-ink">{e.note || c.label}</p>
                          <p className="text-[11px] text-ink-mute capitalize">{c.label}</p>
                        </div>
                        <span className="text-sm font-bold text-ink">₹{e.amount}</span>
                        <button
                          onClick={() => { setEditingExpense(e); setSheet("add"); }}
                          className="text-ink-mute/50 active:text-brand-400 ml-1"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            update((d) => { d.expenses = d.expenses.filter((x) => x.id !== e.id); });
                            if (!isDemo() && user) {
                              dbDeleteExpense(e.id);
                            }
                          }}
                          className="text-ink-mute/50 active:text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Splits */}
        <div className="flex items-center justify-between mt-7 mb-3">
          <p className="text-[15px] font-bold text-ink">Bill splits</p>
          <button onClick={() => setSheet("split")} className="text-brand-300 text-sm font-semibold">+ Split</button>
        </div>
        {splits.length === 0 ? (
          <div className="card p-5 text-center">
            <p className="text-ink-mute text-sm">Split a bill with friends and track who owes what.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {splits.slice().reverse().map((s) => {
              const per = s.total / (s.people.length + 1);
              return (
                <div key={s.id} className="card p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">🧾</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{s.note || "Split"} · ₹{s.total}</p>
                    <p className="text-[11px] text-ink-mute">{s.people.length + 1} people · ₹{per.toFixed(0)} each</p>
                  </div>
                  <button
                    onClick={() => { setEditingSplit(s); setSheet("split"); }}
                    className="text-ink-mute/50 active:text-brand-400 mr-1"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      update((d) => { d.splits = d.splits.filter((x) => x.id !== s.id); });
                      if (!isDemo() && user) {
                        dbDeleteSplit(s.id);
                      }
                    }}
                    className="text-ink-mute/50 active:text-red-500"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddExpenseSheet open={sheet === "add"} onClose={() => { setSheet(null); setEditingExpense(null); }} editing={editingExpense} />
      <BudgetSheet open={sheet === "budget"} onClose={() => setSheet(null)} />
      <SplitSheet open={sheet === "split"} onClose={() => { setSheet(null); setEditingSplit(null); }} editing={editingSplit} />
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold text-ink">{value}</p>
      <p className="text-[10px] text-ink-mute">{label}</p>
    </div>
  );
}

/* ── Add expense (improved: amount pad, category, note, date) ── */
function AddExpenseSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Expense | null;
}) {
  const { update, uid } = useStore();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<ExpenseCategory>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  useEffect(() => {
    if (open && editing) {
      setAmount(String(editing.amount));
      setCat(editing.category);
      setNote(editing.note || "");
      setDate(editing.date);
    } else if (open && !editing) {
      setAmount("");
      setNote("");
      setCat("food");
      setDate(todayISO());
    }
  }, [open, editing]);

  function reset() {
    setAmount("");
    setNote("");
    setCat("food");
    setDate(todayISO());
  }

  function save(addAnother: boolean) {
    const a = Number(amount);
    if (!a || a <= 0) return;

    if (editing) {
      const updated = { ...editing, amount: a, category: cat, date, note: note.trim() || undefined };
      update((d) => { d.expenses = d.expenses.map(x => x.id === editing.id ? updated : x); });
      if (!isDemo() && user) dbSaveExpense(user.id, updated);
      onClose();
      return;
    }

    const newExpense = {
      id: uid(),
      amount: a,
      category: cat,
      date,
      note: note.trim() || undefined,
    };
    update((d) => {
      d.expenses.push(newExpense);
    });

    if (!isDemo() && user) {
      dbSaveExpense(user.id, newExpense);
    }

    if (addAnother) {
      reset();
    } else {
      reset();
      onClose();
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Edit expense" : "Add expense"}>
      <div className="space-y-4">
        {/* amount */}
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold text-ink-mute">₹</span>
            <input
              autoFocus
              type="number"
              inputMode="numeric"
              className="text-5xl font-bold text-ink bg-transparent outline-none w-[60%] text-center"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* category */}
        <div className="grid grid-cols-5 gap-1.5">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`py-2.5 rounded-xl flex flex-col items-center gap-1 transition ${
                cat === c.key ? "ring-2" : "bg-white/[0.07]"
              }`}
              style={
                cat === c.key
                  ? { background: c.color + "1a", boxShadow: `0 0 0 2px ${c.color}` }
                  : {}
              }
            >
              <span className="text-lg">{c.emoji}</span>
              <span className="text-[10px] font-medium text-ink-soft">
                {c.label}
              </span>
            </button>
          ))}
        </div>

        <input
          className="input"
          placeholder="Note (optional) — e.g. canteen lunch"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <input
          type="date"
          className="input"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => save(true)}
              disabled={!amount}
              className="btn-ghost flex-1 disabled:opacity-40"
            >
              Save &amp; add another
            </button>
          )}
          <button
            onClick={() => save(false)}
            disabled={!amount}
            className="btn-primary flex-1 disabled:opacity-40"
          >
            {editing ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function BudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update } = useStore();
  const [val, setVal] = useState(
    data.profile.monthlyBudget ? String(data.profile.monthlyBudget) : ""
  );

  function save() {
    update((d) => {
      d.profile.monthlyBudget = Number(val) || 0;
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Monthly budget">
      <p className="text-ink-mute text-sm mb-4">
        Set how much you want to spend per month. We&apos;ll track you against it.
      </p>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl font-bold text-ink">₹</span>
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          className="input flex-1 text-xl font-bold"
          placeholder="e.g. 5000"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mb-4">
        {[3000, 5000, 8000, 10000].map((q) => (
          <button
            key={q}
            onClick={() => setVal(String(q))}
            className="flex-1 py-2 rounded-xl bg-white/[0.07] text-ink-soft text-sm font-semibold"
          >
            {q / 1000}k
          </button>
        ))}
      </div>
      <button onClick={save} className="btn-primary w-full">
        {Number(val) > 0 ? "Save budget" : "Remove budget"}
      </button>
    </Sheet>
  );
}

function SplitSheet({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: SplitBill | null }) {
  const { update, uid } = useStore();
  const { user } = useAuth();
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    if (open && editing) {
      setTotal(String(editing.total));
      setNote(editing.note || "");
      setPeople(editing.people);
    } else if (open && !editing) {
      setTotal("");
      setNote("");
      setPeople([]);
    }
  }, [open, editing]);

  const per = total ? Number(total) / (people.length + 1) : 0;

  function save() {
    const t = Number(total);
    if (!t || people.length === 0) return;

    if (editing) {
      const updated = { ...editing, total: t, people, note: note.trim() || undefined };
      update((d) => { d.splits = d.splits.map(x => x.id === editing.id ? updated : x); });
      if (!isDemo() && user) dbSaveSplit(user.id, updated);
      onClose();
      return;
    }

    const newSplit = {
      id: uid(),
      total: t,
      people,
      paidBy: "me",
      date: todayISO(),
      note: note.trim() || undefined,
    };
    update((d) => {
      d.splits.push(newSplit);
    });

    if (!isDemo() && user) {
      dbSaveSplit(user.id, newSplit);
    }

    setTotal("");
    setNote("");
    setPeople([]);
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? "Edit split" : "Split a bill"}>
      <div className="space-y-3">
        <input
          className="input"
          placeholder="What for? (e.g. Dinner)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-ink">₹</span>
          <input
            type="number"
            className="input flex-1 text-lg font-bold"
            placeholder="Total"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add a friend"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                setPeople((p) => [...p, name.trim()]);
                setName("");
              }
            }}
          />
          <button
            onClick={() => {
              if (name.trim()) {
                setPeople((p) => [...p, name.trim()]);
                setName("");
              }
            }}
            className="btn-primary px-4"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        {people.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="pill bg-brand-500/15 text-brand-300">You</span>
            {people.map((p, i) => (
              <button
                key={i}
                onClick={() =>
                  setPeople((arr) => arr.filter((_, idx) => idx !== i))
                }
                className="pill bg-white/[0.07] text-ink-soft"
              >
                {p} ✕
              </button>
            ))}
          </div>
        )}
        {per > 0 && (
          <div className="bg-brand-500/15 rounded-xl p-3 text-center">
            <p className="text-sm text-brand-300">
              Each pays <span className="font-bold">₹{per.toFixed(0)}</span> ·{" "}
              {people.length + 1} people
            </p>
          </div>
        )}
        <button onClick={save} className="btn-primary w-full">
          {editing ? "Update split" : "Save split"}
        </button>
      </div>
    </Sheet>
  );
}
