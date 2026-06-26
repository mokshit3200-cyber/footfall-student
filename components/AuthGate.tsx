"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Tab = "signup" | "signin";
type SignupStep = 0 | 1 | 2; // 0=name, 1=username, 2=email+pw

// Client-side login throttle (backs up Supabase's server-side rate limit)
const loginThrottle = { failures: 0, lockedUntil: 0 };
const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function generateSuggestions(name: string): string[] {
  const parts = name.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/);
  const first = parts[0] || "";
  const last = parts[1] || "";
  const num = Math.floor(Math.random() * 900) + 100;
  const s: string[] = [];
  if (first && last) {
    s.push(`${first}.${last}`);
    s.push(`${first}_${last}`);
    s.push(`${first}${last[0]}`);
  }
  if (first) s.push(`${first}${num}`);
  return s.filter((x) => x.length >= 3).slice(0, 4);
}

export default function AuthGate() {
  const [tab, setTab] = useState<Tab>("signup");
  const [step, setStep] = useState<SignupStep>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState("");

  // signup fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [checkingUn, setCheckingUn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // signin fields
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");
  const [showSiPw, setShowSiPw] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvail(null);
      return;
    }
    setCheckingUn(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      setUsernameAvail(!data);
      setCheckingUn(false);
    }, 500);
  }, [username]);

  function goToUsername() {
    setSuggestions(generateSuggestions(name));
    setStep(1);
  }

  function pickSuggestion(s: string) {
    setUsername(s);
  }

  async function signUp() {
    setLoading(true);
    setError("");
    const refCode = typeof window !== "undefined" ? localStorage.getItem("cmpus_ref") : null;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          referred_by_code: refCode || undefined,
        },
      },
    });
    if (error) {
      if (process.env.NODE_ENV === "development") console.error("Supabase signUp error:", JSON.stringify(error), error);
      let msg = "Sign up failed. Please try again.";
      if (error.message) {
        if (error.message.toLowerCase().includes("rate limit")) {
          msg = "Too many attempts. Please wait a few minutes and try again.";
        } else if (error.message.toLowerCase().includes("already registered")) {
          msg = "An account with this email already exists. Try signing in instead.";
        } else if (error.message !== "{}") {
          msg = error.message;
        }
      }
      setError(msg);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cmpus_ref");
      }
      // data.user without data.session = email confirmation required
      if (data.user && !data.session) {
        setCheckEmail(email.trim());
      }
    }
    setLoading(false);
  }

  async function signIn() {
    // Client-side throttle
    const now = Date.now();
    if (loginThrottle.lockedUntil > now) {
      const mins = Math.ceil((loginThrottle.lockedUntil - now) / 60000);
      setError(`Too many failed attempts. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
      return;
    }

    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(),
      password: siPassword,
    });
    if (error) {
      loginThrottle.failures += 1;
      if (loginThrottle.failures >= MAX_FAILURES) {
        loginThrottle.lockedUntil = Date.now() + LOCKOUT_MS;
        loginThrottle.failures = 0;
        setError("Too many failed attempts. Your sign-in is locked for 15 minutes.");
      } else if (error.message?.toLowerCase().includes("email not confirmed")) {
        setCheckEmail(siEmail.trim());
      } else if (error.message?.toLowerCase().includes("invalid login")) {
        setError("Incorrect email or password.");
      } else {
        setError(error.message || "Sign in failed. Please try again.");
      }
    } else {
      loginThrottle.failures = 0;
      loginThrottle.lockedUntil = 0;
    }
    setLoading(false);
  }

  async function resendVerification() {
    if (!checkEmail) return;
    setLoading(true);
    await supabase.auth.resend({ type: "signup", email: checkEmail });
    setLoading(false);
  }

  function resetSignup() {
    setStep(0);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setError("");
    setUsernameAvail(null);
  }

  // ── Check email screen ───────────────────────────────────
  if (checkEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-fade-in">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Check your email</h1>
        <p className="text-ink-mute text-[15px] mb-1">We sent a link to</p>
        <p className="text-brand-300 font-semibold text-lg mb-4">{checkEmail}</p>
        <p className="text-ink-mute text-sm leading-relaxed max-w-xs">
          Click the link in the email to activate your account, then come back and sign in.
        </p>
        <button
          onClick={() => {
            setCheckEmail("");
            setTab("signin");
            setSiEmail(checkEmail);
          }}
          className="mt-8 btn-primary px-8 py-3"
        >
          Go to Sign In →
        </button>
        <button
          onClick={resendVerification}
          disabled={loading}
          className="mt-3 text-sm text-ink-mute underline underline-offset-2 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-14 pb-10 animate-fade-in">
      {/* Brand */}
      <div className="mb-7">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-black/40 ring-1 ring-white/10 overflow-hidden" style={{ backgroundColor: "#1A1D1B" }}>
          <img src="/brand/mark-white.png" alt="Cmpus" className="w-9 h-9 object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Cmpus</h1>
        <p className="text-ink-mute text-sm mt-0.5">Your campus, sorted.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/[0.05] rounded-xl p-1 mb-6">
        {(["signup", "signin"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(""); resetSignup(); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === t ? "bg-brand-500 text-white" : "text-ink-mute"
            }`}
          >
            {t === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      {/* ── SIGN UP ── */}
      {tab === "signup" && (
        <div className="flex-1 flex flex-col">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i <= step ? "bg-brand-500 flex-1" : "bg-white/10 w-6"
                }`}
              />
            ))}
          </div>

          {/* Step 0 — Name */}
          {step === 0 && (
            <div className="flex-1 flex flex-col animate-fade-up">
              <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 1 of 3</p>
              <h2 className="text-xl font-bold text-ink mb-1">What&apos;s your name?</h2>
              <p className="text-ink-mute text-sm mb-6">Your real name, like on your college ID.</p>
              <input
                autoFocus
                className="input"
                placeholder="Aarav Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && goToUsername()}
              />
              <div className="mt-auto pt-6">
                <button
                  className="btn-primary w-full"
                  disabled={!name.trim()}
                  onClick={goToUsername}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 1 — Username */}
          {step === 1 && (
            <div className="flex-1 flex flex-col animate-fade-up">
              <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 2 of 3</p>
              <h2 className="text-xl font-bold text-ink mb-1">Pick a username</h2>
              <p className="text-ink-mute text-sm mb-5">
                This is how classmates will find you. You can change it later.
              </p>

              {/* Username input */}
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-mute font-semibold">@</span>
                <input
                  autoFocus
                  className="input pl-8 pr-12"
                  placeholder="aarav.singh"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                />
                {/* Availability indicator */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm">
                  {checkingUn ? (
                    <span className="text-ink-mute">…</span>
                  ) : username.length >= 3 ? (
                    usernameAvail ? (
                      <span className="text-green-400 font-bold">✓</span>
                    ) : (
                      <span className="text-red-400 font-bold">✗</span>
                    )
                  ) : null}
                </span>
              </div>

              {/* Availability text */}
              {username.length >= 3 && !checkingUn && (
                <p className={`text-xs mb-4 font-semibold ${usernameAvail ? "text-green-400" : "text-red-400"}`}>
                  {usernameAvail ? `@${username} is available!` : `@${username} is taken. Try another.`}
                </p>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-ink-mute mb-2">Suggestions based on your name:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => pickSuggestion(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                          username === s
                            ? "bg-brand-500 text-white border-brand-500"
                            : "bg-white/[0.05] text-ink-soft border-white/[0.1] hover:border-brand-500/50"
                        }`}
                      >
                        @{s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 space-y-3">
                <button
                  className="btn-primary w-full"
                  disabled={!username || username.length < 3 || !usernameAvail || checkingUn}
                  onClick={() => setStep(2)}
                >
                  Continue →
                </button>
                <button onClick={() => setStep(0)} className="w-full text-center text-ink-mute text-sm">
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Email + Password */}
          {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-up">
              <p className="text-xs text-ink-mute font-semibold uppercase tracking-wider mb-1">Step 3 of 3</p>
              <h2 className="text-xl font-bold text-ink mb-1">Create your login</h2>
              <p className="text-ink-mute text-sm mb-5">Keep this safe — you&apos;ll use it to sign in.</p>

              <div className="space-y-3 flex-1">
                <div>
                  <label className="text-xs font-semibold text-ink-soft mb-1 block">Email</label>
                  <input
                    autoFocus
                    type="email"
                    className="input"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-soft mb-1 block">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      className="input pr-14"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && email && password.length >= 8 && signUp()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute text-xs font-semibold"
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Summary card */}
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl px-4 py-3 mt-2">
                  <p className="text-xs text-ink-mute mb-1">Creating account as</p>
                  <p className="text-sm font-bold text-ink">{name}</p>
                  <p className="text-xs text-brand-300">@{username}</p>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

              <div className="pt-4 space-y-3">
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={loading || !email.trim() || password.length < 8}
                  onClick={signUp}
                >
                  {loading ? <Spinner /> : "Create account 🎉"}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-center text-ink-mute text-sm">
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SIGN IN ── */}
      {tab === "signin" && (
        <div className="flex-1 flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ink mb-1">Welcome back 👋</h2>
          <div>
            <label className="text-xs font-semibold text-ink-soft mb-1 block">Email</label>
            <input
              autoFocus
              type="email"
              className="input"
              placeholder="you@college.edu"
              value={siEmail}
              onChange={(e) => setSiEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-soft mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showSiPw ? "text" : "password"}
                className="input pr-14"
                placeholder="Your password"
                value={siPassword}
                onChange={(e) => setSiPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && signIn()}
              />
              <button
                type="button"
                onClick={() => setShowSiPw((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-mute text-xs font-semibold"
              >
                {showSiPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="mt-auto pt-4">
            <button
              className="btn-primary w-full flex items-center justify-center gap-2"
              disabled={loading || !siEmail.trim() || !siPassword}
              onClick={signIn}
            >
              {loading ? <Spinner /> : "Sign in →"}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-ink-mute pt-4 mt-4">
        By continuing you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
