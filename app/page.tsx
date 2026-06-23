"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/components/store";
import { getMode } from "@/lib/config";
import Onboarding from "@/components/Onboarding";
import AuthGate from "@/components/AuthGate";
import BottomNav, { Tab } from "@/components/BottomNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import Home from "@/components/Home";
import Money from "@/components/Money";
import Connect from "@/components/Connect";
import Marketplace from "@/components/Marketplace";
import MyCampus from "@/components/MyCampus";
import ComingSoon from "@/components/ComingSoon";
import Profile from "@/components/Profile";
import Business from "@/components/Business";
import RemindersEngine from "@/components/RemindersEngine";
import SupabaseSync from "@/components/SupabaseSync";
import { playTick } from "@/components/ui";

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const { data, ready } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [businessMode, setBusinessMode] = useState(false);
  const [inChat, setInChat] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [hasSubjects, setHasSubjects] = useState<boolean | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    setIsDemo(getMode() === "demo");
  }, []);

  // After auth, check if user has subjects yet (determines onboarding state)
  useEffect(() => {
    if (!user || isDemo) return;
    supabase
      .from("subjects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        setHasSubjects((count ?? 0) > 0);
      });
  }, [user, isDemo, onboardingDone]);

  function changeTab(t: Tab) {
    playTick();
    setTab(t);
    setInChat(false);
  }

  // ── Loading ──────────────────────────────────────────────
  const stillLoading =
    !isDemo && (authLoading || (user && hasSubjects === null));

  if (!ready || (stillLoading && !isDemo)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl brand-gradient flex items-center justify-center animate-pulse">
          <span className="text-white font-bold">F</span>
        </div>
      </div>
    );
  }

  // ── Demo mode: use localStorage data (unchanged) ─────────
  if (isDemo) {
    if (!data.profile.onboarded) {
      return (
        <div className="md:max-w-md md:mx-auto">
          <Onboarding onDone={() => {}} />
        </div>
      );
    }
  } else {
    // ── Live mode: require auth ──────────────────────────────
    if (!user) {
      return (
        <div className="md:max-w-md md:mx-auto">
          <AuthGate />
        </div>
      );
    }

    // ── Onboarding: user signed up but no subjects yet ───────
    if (!hasSubjects) {
      return (
        <div className="md:max-w-md md:mx-auto">
          <Onboarding
            onDone={() => {
              setOnboardingDone((v) => !v);
              setHasSubjects(true);
            }}
          />
        </div>
      );
    }
  }

  // ── Business mode ────────────────────────────────────────
  if (businessMode) {
    return <Business onBack={() => setBusinessMode(false)} />;
  }

  const wide = tab === "market" || tab === "connect" || tab === "campus";

  return (
    <div className="md:flex">
      {!inChat && <DesktopSidebar active={tab} onChange={changeTab} />}
      <div className="flex-1 min-w-0">
        <RemindersEngine />
        {!isDemo && user && <SupabaseSync />}
        <main className={`mx-auto w-full ${wide ? "md:max-w-5xl" : "md:max-w-2xl"}`}>
          {tab === "home" && <Home onSwitchTab={changeTab} />}
          {tab === "money" && <Money />}
          {tab === "connect" && <Connect onSwitchTab={changeTab} onChatOpen={setInChat} />}
          {tab === "market" && <Marketplace onSwitchTab={changeTab} />}
          {tab === "campus" && <MyCampus />}
          {tab === "profile" && (
            <Profile onOpenBusiness={() => setBusinessMode(true)} />
          )}
        </main>
      </div>
      {!inChat && <BottomNav active={tab} onChange={changeTab} />}
    </div>
  );
}
