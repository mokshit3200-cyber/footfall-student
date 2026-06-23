"use client";

import { useMemo, useState } from "react";
import { useStore } from "./store";
import { todayISO } from "@/lib/dates";
import { Sheet } from "./ui";
import {
  ChevronRight,
  PlusIcon,
  SparkIcon,
  TrashIcon,
} from "./icons";
import { BusinessType } from "@/lib/types";

const TYPES: { key: BusinessType; label: string; desc: string; emoji: string }[] =
  [
    { key: "sell", label: "Sell something", desc: "Merch, food, products", emoji: "🛍️" },
    { key: "service", label: "Offer a service", desc: "Design, tutoring, photos", emoji: "🎨" },
    { key: "club", label: "Run a club / event", desc: "Tickets, registrations", emoji: "🎟️" },
  ];

export default function Business({ onBack }: { onBack: () => void }) {
  const { data } = useStore();
  const registered = data.business?.registered;
  return registered ? (
    <BuilderDashboard onBack={onBack} />
  ) : (
    <Register onBack={onBack} />
  );
}

/* ── Registration ─────────────────────────────────────────── */
function Register({ onBack }: { onBack: () => void }) {
  const { update } = useStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessType>("sell");

  function go() {
    update((d) => {
      d.business = {
        registered: true,
        name: name.trim() || "My Venture",
        type,
      };
    });
  }

  return (
    <div className="px-5 pt-12 pb-28 animate-fade-in md:max-w-xl md:mx-auto md:w-full">
      <button onClick={onBack} className="text-ink-mute text-sm mb-6">
        ← Back to student
      </button>
      <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mb-5">
        <SparkIcon className="w-7 h-7 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">Start your venture</h1>
      <p className="text-ink-mute text-[15px] mb-6">
        Run it like a real business — orders, customers, money. The same tools
        shops across India use, sized for you.
      </p>

      <label className="text-sm font-semibold text-ink-soft mb-2 block">
        What are you starting?
      </label>
      <div className="space-y-2 mb-5">
        {TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            className={`w-full card p-3.5 flex items-center gap-3 text-left transition ${
              type === t.key ? "ring-2 ring-brand-400" : ""
            }`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-ink">{t.label}</p>
              <p className="text-[11px] text-ink-mute">{t.desc}</p>
            </div>
            {type === t.key && (
              <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <label className="text-sm font-semibold text-ink-soft mb-2 block">
        Name your venture
      </label>
      <input
        className="input mb-6"
        placeholder="e.g. Hostel Brownies"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={go} className="btn-primary w-full">
        Create venture
      </button>
    </div>
  );
}

/* ── Builder dashboard ────────────────────────────────────── */
function BuilderDashboard({ onBack }: { onBack: () => void }) {
  const { data, update, uid } = useStore();
  const biz = data.business!;
  const [tab, setTab] = useState<"dashboard" | "orders" | "customers" | "money">(
    "dashboard"
  );
  const [addOpen, setAddOpen] = useState(false);

  const orders = data.orders;
  const revenue = useMemo(
    () =>
      orders.filter((o) => o.status === "paid").reduce((a, o) => a + o.amount, 0),
    [orders]
  );
  const pending = orders.filter((o) => o.status !== "paid").length;
  const customers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.customer))),
    [orders]
  );

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* business-mode header (different accent — feels like another side) */}
      <div className="px-5 pt-12 pb-4 md:max-w-3xl md:mx-auto md:w-full md:px-2">
        <button onClick={onBack} className="text-white/60 text-sm mb-4">
          ← Back to student
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-300 text-xs font-semibold uppercase tracking-wide">
              Business mode
            </p>
            <h1 className="text-white text-xl font-bold">{biz.name}</h1>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
            <span className="text-white font-bold">
              {biz.name[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* content card */}
      <div className="bg-black rounded-t-3xl min-h-[70vh] px-5 pt-5 pb-28 md:max-w-3xl md:mx-auto md:w-full md:rounded-3xl md:px-8 md:mb-8">
        {/* sub tabs */}
        <div className="flex gap-1.5 mb-5 bg-white/[0.07] p-1 rounded-xl">
          {(["dashboard", "orders", "customers", "money"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                tab === t ? "bg-[#0e0e0e] text-ink shadow-sm" : "text-ink-mute"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="animate-fade-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
              <BizStat label="Revenue" value={"₹" + revenue} accent />
              <BizStat label="Orders" value={String(orders.length)} />
              <BizStat label="Pending" value={String(pending)} />
              <BizStat label="Customers" value={String(customers.length)} />
            </div>

            {orders.length === 0 ? (
              <div className="card p-6 text-center mt-4">
                <p className="text-sm font-semibold text-ink mb-1">
                  No orders yet
                </p>
                <p className="text-xs text-ink-mute mb-3">
                  Add your first order to see your business grow.
                </p>
                <button
                  onClick={() => setAddOpen(true)}
                  className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-sm"
                >
                  <PlusIcon className="w-4 h-4" /> Add order
                </button>
              </div>
            ) : (
              <>
                {/* paid progress */}
                <div className="card p-4 mt-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-sm font-bold text-ink">Payments</p>
                    <span className="text-xs text-ink-mute font-semibold">
                      {orders.filter((o) => o.status === "paid").length}/
                      {orders.length} paid
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full brand-gradient rounded-full transition-all"
                      style={{
                        width:
                          (orders.filter((o) => o.status === "paid").length /
                            orders.length) *
                            100 +
                          "%",
                      }}
                    />
                  </div>
                </div>

                {/* recent orders */}
                <div className="flex items-center justify-between mt-5 mb-2">
                  <p className="text-sm font-bold text-ink">Recent orders</p>
                  <button
                    onClick={() => setTab("orders")}
                    className="text-brand-300 text-xs font-semibold"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {orders
                    .slice()
                    .reverse()
                    .slice(0, 4)
                    .map((o) => (
                      <div
                        key={o.id}
                        className="card p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink truncate">
                            {o.item}
                          </p>
                          <p className="text-[11px] text-ink-mute">
                            {o.customer}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-brand-300">
                            ₹{o.amount}
                          </p>
                          <span
                            className={`text-[10px] font-bold capitalize ${
                              o.status === "paid"
                                ? "text-brand-300"
                                : o.status === "fulfilled"
                                ? "text-amber-300"
                                : "text-ink-mute"
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setAddOpen(true)}
                  className="btn-ghost w-full mt-3 flex items-center justify-center gap-1.5 text-sm"
                >
                  <PlusIcon className="w-4 h-4" /> Add order
                </button>
              </>
            )}

            <div className="mt-5 rounded-2xl border border-brand-500/30 bg-brand-500/15 p-4">
              <p className="text-[13px] font-semibold text-brand-200 mb-1">
                💡 This is a taste of Footfall Suite
              </p>
              <p className="text-[12px] text-brand-300 leading-relaxed">
                The full version runs real shops — pharmacies, gyms, salons. When
                you start something bigger, it&apos;s right here waiting.
              </p>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="animate-fade-up">
            <button
              onClick={() => setAddOpen(true)}
              className="btn-primary w-full mb-4 flex items-center justify-center gap-1.5"
            >
              <PlusIcon className="w-5 h-5" /> New order
            </button>
            {orders.length === 0 ? (
              <p className="text-ink-mute text-sm text-center py-8">
                No orders yet.
              </p>
            ) : (
              <div className="space-y-2">
                {orders
                  .slice()
                  .reverse()
                  .map((o) => (
                    <div key={o.id} className="card p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-bold text-ink">{o.item}</p>
                        <span className="text-sm font-bold text-brand-300">
                          ₹{o.amount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-ink-mute">{o.customer}</p>
                        <div className="flex gap-1">
                          {(["new", "fulfilled", "paid"] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() =>
                                update((d) => {
                                  const t = d.orders.find((x) => x.id === o.id);
                                  if (t) t.status = s;
                                })
                              }
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                o.status === s
                                  ? "bg-brand-500 text-white"
                                  : "bg-white/[0.07] text-ink-mute"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              update((d) => {
                                d.orders = d.orders.filter((x) => x.id !== o.id);
                              })
                            }
                            className="text-ink-mute ml-1"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === "customers" && (
          <div className="animate-fade-up">
            {customers.length === 0 ? (
              <p className="text-ink-mute text-sm text-center py-8">
                Customers appear here as you add orders.
              </p>
            ) : (
              <div className="space-y-2">
                {customers.map((c) => {
                  const co = orders.filter((o) => o.customer === c);
                  const spent = co.reduce((a, o) => a + o.amount, 0);
                  return (
                    <div
                      key={c}
                      className="card p-3.5 flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center">
                        <span className="text-brand-300 text-sm font-bold">
                          {c[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{c}</p>
                        <p className="text-[11px] text-ink-mute">
                          {co.length} orders
                        </p>
                      </div>
                      <span className="text-sm font-bold text-ink">₹{spent}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "money" && (
          <div className="animate-fade-up">
            <div className="card p-5 text-center mb-3">
              <p className="text-xs text-ink-mute mb-1">Total earned</p>
              <p className="text-3xl font-bold text-brand-300">₹{revenue}</p>
            </div>
            <div className="rounded-2xl border border-dashed border-brand-300 bg-brand-500/15 p-4 text-center">
              <p className="text-sm font-semibold text-brand-200 mb-1">
                UPI collection — coming soon
              </p>
              <p className="text-xs text-brand-300">
                Share a payment link, collect money, and track it all here.
              </p>
            </div>
          </div>
        )}
      </div>

      <AddOrderSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function BizStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? "bg-brand-500" : "card"}`}>
      <p
        className={`text-xl font-bold ${accent ? "text-white" : "text-ink"}`}
      >
        {value}
      </p>
      <p
        className={`text-[11px] font-medium mt-0.5 ${
          accent ? "text-white/80" : "text-ink-mute"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

function AddOrderSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { update, uid } = useStore();
  const [customer, setCustomer] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");

  function add() {
    const a = Number(amount);
    if (!customer.trim() || !item.trim() || !a) return;
    update((d) => {
      d.orders.push({
        id: uid(),
        customer: customer.trim(),
        item: item.trim(),
        amount: a,
        status: "new",
        date: todayISO(),
      });
    });
    setCustomer("");
    setItem("");
    setAmount("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="New order">
      <div className="space-y-3">
        <input
          autoFocus
          className="input"
          placeholder="Customer name"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
        <input
          className="input"
          placeholder="What did they order?"
          value={item}
          onChange={(e) => setItem(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-ink">₹</span>
          <input
            type="number"
            className="input flex-1 text-lg font-bold"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button onClick={add} className="btn-primary w-full">
          Add order
        </button>
      </div>
    </Sheet>
  );
}
