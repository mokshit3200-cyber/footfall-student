"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
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
import Messages from "@/components/Messages";
import Profile from "@/components/Profile";
import Business from "@/components/Business";
import RemindersEngine from "@/components/RemindersEngine";
import SupabaseSync from "@/components/SupabaseSync";
import { playTick } from "@/components/ui";
import { sanitizeHandle } from "@/lib/validation";

export default function Page() {
  const { user, loading: authLoading, profile, refreshProfile } = useAuth();
  const { data, ready } = useStore();
  const [tab, setTab] = useState<Tab>("home");
  const [businessMode, setBusinessMode] = useState(false);
  const [replySheetOpen, setReplySheetOpen] = useState(false);
  const [inChat, setInChat] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(getMode() === "demo");
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const cleanRef = sanitizeHandle(ref).slice(0, 8).toUpperCase();
      if (/^[A-Z0-9]{6,8}$/.test(cleanRef)) {
        localStorage.setItem("cmpus_ref", cleanRef);
      }
    }
  }, []);

  // Synchronize state from URL parameters on boot and popstate navigation
  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") as Tab | "business" | null;
      
      if (urlTab) {
        if (urlTab === "business") {
          setBusinessMode(true);
        } else {
          setBusinessMode(false);
          setTab(urlTab);
        }
      } else {
        setTab("home");
        setBusinessMode(false);
      }

      // Check if we are inside a chat view (inChat needs to be set to hide navbar)
      const chat = params.get("chat");
      setInChat(!!chat);
    }

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  function changeTab(t: Tab) {
    playTick();
    setTab(t);
    setInChat(false);
    
    // Update URL query parameters
    const params = new URLSearchParams(window.location.search);
    params.set("tab", t);
    params.delete("chat"); // close active chat on tab switch
    params.delete("item"); // close active item on tab switch
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function handleOpenBusiness() {
    setBusinessMode(true);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "business");
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  function handleCloseBusiness() {
    setBusinessMode(false);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "profile");
    window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
  }

  // Onboarding is complete once college is saved — persists across logins
  const onboardingComplete = !!(profile?.college && profile.college.trim().length > 0);

  // ── Loading ──────────────────────────────────────────────
  // Only block on auth check — profile loads in background after
  const stillLoading = !isDemo && authLoading;

  if (!ready || (stillLoading && !isDemo)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl brand-gradient flex items-center justify-center animate-pulse">
          <span className="text-white font-bold">F</span>
        </div>
      </div>
    );
  }

  // ── Demo mode: skip onboarding, go straight to app ──────
  if (!isDemo) {
    // ── Live mode: require auth ──────────────────────────────
    if (!user) {
      return (
        <div className="md:max-w-md md:mx-auto">
          <AuthGate />
        </div>
      );
    }

    // ── Onboarding: college not set yet ──────────────────────
    if (!onboardingComplete) {
      return (
        <div className="md:max-w-md md:mx-auto">
          <Onboarding onDone={() => refreshProfile()} />
        </div>
      );
    }
  }

  // ── Business mode ────────────────────────────────────────
  if (businessMode) {
    return <Business onBack={handleCloseBusiness} />;
  }

  const wide = tab === "market" || tab === "connect";

  return (
    <div className="md:flex">
      {!inChat && <DesktopSidebar active={tab} onChange={changeTab} />}
      <div className="flex-1 min-w-0">
        <RemindersEngine />
        {!isDemo && user && <SupabaseSync />}
        <main className={`mx-auto w-full ${wide ? "md:max-w-5xl" : "md:max-w-2xl"}`}>
          {tab === "home" && <Home onSwitchTab={changeTab} />}
          {tab === "money" && <Money />}
          {tab === "connect" && <Connect onSwitchTab={changeTab} onChatOpen={setInChat} onReplySheetOpen={setReplySheetOpen} />}
          {tab === "messages" && <Messages onChatOpen={setInChat} />}
          {tab === "market" && <Marketplace onSwitchTab={changeTab} />}
          {tab === "profile" && (
            <Profile onOpenBusiness={handleOpenBusiness} onSwitchTab={(t) => changeTab(t as Tab)} />
          )}
        </main>
      </div>
      {!inChat && !replySheetOpen && <BottomNav active={tab} onChange={changeTab} />}
    </div>
  );
}
