"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useStore } from "./store";
import UserProfileView from "./UserProfileView";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { dbUpdateProfile, uploadPhoto } from "@/lib/dbActions";
import { isDemo } from "@/lib/config";
import { subscribeUserToPush, unsubscribeUserFromPush } from "./PWA";
import { overallStats } from "@/lib/attendance";
import { Sheet, SectionHeader, playPop, triggerConfetti } from "./ui";
import { ChevronRight, SparkIcon, XIcon, CheckIcon, TrashIcon, ArrowLeftIcon } from "./icons";

export default function Profile({
  onOpenBusiness,
  onSwitchTab,
}: {
  onOpenBusiness: () => void;
  onSwitchTab?: (tab: string) => void;
}) {
  const { data, update, reset } = useStore();
  const { profile, business, subjects, attendance, deadlines } = data;
  const { user, signOut, refreshProfile } = useAuth();
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  useEffect(() => {
    if (isDemo() || !user) {
      setFollowerCount(142);
      setFollowingCount(98);
      setIsPrivate(false);
      return;
    }
    Promise.all([
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id).eq("status", "accepted"),
      supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id).eq("status", "accepted"),
      supabase.from("profiles").select("is_private").eq("id", user.id).single(),
    ]).then(([followers, following, prof]) => {
      setFollowerCount(followers.count ?? 0);
      setFollowingCount(following.count ?? 0);
      setIsPrivate(prof.data?.is_private ?? false);
    });
  }, [user]);

  async function togglePrivacy() {
    const next = !isPrivate;
    setIsPrivate(next);
    if (!isDemo() && user) {
      await supabase.from("profiles").update({ is_private: next }).eq("id", user.id);
    }
  }

  const [remindersOpen, setRemindersOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Social sheets & custom modals states
  const [socialSheetOpen, setSocialSheetOpen] = useState(false);
  const [socialSheetType, setSocialSheetType] = useState<"followers" | "following">("followers");
  const [socialPeople, setSocialPeople] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [selectedClassmate, setSelectedClassmate] = useState<any | null>(null);
  const [academicSettingsOpen, setAcademicSettingsOpen] = useState(false);
  const [moneySettingsOpen, setMoneySettingsOpen] = useState(false);
  const [selectedListingToEdit, setSelectedListingToEdit] = useState<any | null>(null);

  const overall = useMemo(
    () => overallStats(attendance, profile.attendanceTarget),
    [attendance, profile.attendanceTarget]
  );
  const openDeadlines = deadlines.filter((d) => !d.done).length;

  useEffect(() => {
    if (!socialSheetOpen) return;
    if (isDemo() || !user) {
      if (socialSheetType === "followers") {
        const mockFollowers = (data.classmates || []).slice(0, 3);
        setSocialPeople(mockFollowers.map(c => ({ ...c, followed: c.followed })));
      } else {
        const mockFollowing = (data.classmates || []).filter(c => c.followed);
        setSocialPeople(mockFollowing.map(c => ({ ...c, followed: true })));
      }
      return;
    }

    async function loadSocial() {
      setSocialLoading(true);
      try {
        if (socialSheetType === "followers") {
          const { data: res, error } = await supabase.from("follows")
            .select("id, status, follower:profiles!follows_follower_id_fkey(id,name,username,avatar_url,college,course,year,verified)")
            .eq("following_id", user!.id)
            .eq("status", "accepted");
          if (error) throw error;
          const list = (res ?? []).map((row: any) => ({
            id: row.follower.id,
            name: row.follower.name,
            username: row.follower.username,
            avatar: row.follower.avatar_url,
            college: row.follower.college,
            course: row.follower.course,
            year: row.follower.year,
            verified: row.follower.verified,
            followed: false,
          }));

          if (list.length > 0) {
            const { data: followsBack } = await supabase.from("follows")
              .select("following_id")
              .eq("follower_id", user!.id)
              .in("following_id", list.map(x => x.id))
              .eq("status", "accepted");
            const followingIds = new Set((followsBack ?? []).map(x => x.following_id));
            list.forEach(x => {
              x.followed = followingIds.has(x.id);
            });
          }
          setSocialPeople(list);
        } else {
          const { data: res, error } = await supabase.from("follows")
            .select("id, status, following:profiles!follows_following_id_fkey(id,name,username,avatar_url,college,course,year,verified)")
            .eq("follower_id", user!.id)
            .eq("status", "accepted");
          if (error) throw error;
          const list = (res ?? []).map((row: any) => ({
            id: row.following.id,
            name: row.following.name,
            username: row.following.username,
            avatar: row.following.avatar_url,
            college: row.following.college,
            course: row.following.course,
            year: row.following.year,
            verified: row.following.verified,
            followed: true,
          }));
          setSocialPeople(list);
        }
      } catch (err) {
        console.error("Error loading social connections:", err);
      } finally {
        setSocialLoading(false);
      }
    }

    loadSocial();
  }, [socialSheetOpen, socialSheetType, user, data.classmates]);

  const handleRemoveFollower = async (person: any) => {
    if (isDemo()) {
      setSocialPeople(prev => prev.filter(p => p.id !== person.id));
      setFollowerCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
      return;
    }
    if (!user) return;
    const { error } = await supabase.from("follows")
      .delete()
      .eq("follower_id", person.id)
      .eq("following_id", user.id);
    if (!error) {
      setSocialPeople(prev => prev.filter(p => p.id !== person.id));
      setFollowerCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
    }
  };

  const handleSocialAction = async (person: any) => {
    if (isDemo()) {
      update((d) => {
        const found = (d.classmates || []).find(c => c.id === person.id);
        if (found) found.followed = !found.followed;
      });
      setSocialPeople(prev => prev.map(p => p.id === person.id ? { ...p, followed: !p.followed } : p));
      setFollowingCount(prev => {
        if (prev === null) return null;
        return person.followed ? Math.max(0, prev - 1) : prev + 1;
      });
      return;
    }

    if (!user) return;
    if (person.followed) {
      const { error } = await supabase.from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", person.id);
      if (!error) {
        setSocialPeople(prev => prev.map(p => p.id === person.id ? { ...p, followed: false } : p));
        setFollowingCount(prev => prev !== null ? Math.max(0, prev - 1) : null);
      }
    } else {
      const { data: targetProfile } = await supabase.from("profiles")
        .select("is_private")
        .eq("id", person.id)
        .single();
      const status = targetProfile?.is_private ? "pending" : "accepted";
      const { error } = await supabase.from("follows")
        .insert({
          follower_id: user.id,
          following_id: person.id,
          status: status
        });
      if (!error) {
        setSocialPeople(prev => prev.map(p => p.id === person.id ? { ...p, followed: status === "accepted" } : p));
        if (status === "accepted") {
          setFollowingCount(prev => prev !== null ? prev + 1 : null);
        }
      }
    }
  };

  return (
    <div className="px-5 pt-12 pb-28 min-h-screen flex flex-col no-scrollbar">
      {/* INSTAGRAM-STYLE PROFILE HEADER */}
      <div className="flex items-center justify-between mb-5">
        <div className="relative shrink-0">
          <div 
            onClick={() => setEditProfileOpen(true)}
            className="w-20 h-20 rounded-full bg-white/[0.07] border border-white/[0.14] flex items-center justify-center cursor-pointer active:scale-95 transition overflow-hidden"
          >
            {profile.avatar && profile.avatar.startsWith("data:") ? (
              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-3xl">{profile.avatar || "👨‍💻"}</span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 flex justify-around text-center pl-4 py-1">
          <button 
            onClick={() => {
              const el = document.getElementById("my-listings-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="focus:outline-none cursor-pointer active:scale-95 transition"
          >
            <p className="text-base font-black text-ink tabular-nums">{data.listings?.length || 0}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Listings</p>
          </button>
          <button 
            onClick={() => {
              setSocialSheetType("followers");
              setSocialSheetOpen(true);
            }}
            className="focus:outline-none cursor-pointer active:scale-95 transition"
          >
            <p className="text-base font-black text-ink tabular-nums">{followerCount ?? "—"}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Followers</p>
          </button>
          <button 
            onClick={() => {
              setSocialSheetType("following");
              setSocialSheetOpen(true);
            }}
            className="focus:outline-none cursor-pointer active:scale-95 transition"
          >
            <p className="text-base font-black text-ink tabular-nums">{followingCount ?? "—"}</p>
            <p className="text-[9px] text-ink-mute font-bold uppercase tracking-wider">Following</p>
          </button>
        </div>
      </div>

      {/* Profile Info block */}
      <div className="mb-4 pl-1 text-left">
        <h1 className="text-base font-bold text-ink leading-tight">{profile.name || "Student Name"}</h1>
        {profile.username && (
          <p className="text-xs text-brand-300 font-medium mt-0.5 flex items-center gap-2">
            @{profile.username}
            <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[9px] font-black tracking-widest uppercase border border-brand-500/30">BETA</span>
          </p>
        )}
        <p className="text-xs text-ink-soft mt-1.5 flex items-center gap-1.5 font-semibold">
          <span>🎓</span>
          <span>{profile.course || "B.Tech Computer Science"}</span>
        </p>
        {profile.college && (
          <p className="text-xs text-ink-mute mt-1 flex items-center gap-1.5 font-semibold">
            <span>🏫</span>
            <span>{profile.college} {profile.year ? `(Year ${profile.year})` : ""}</span>
          </p>
        )}
        {/* Bio */}
        {profile.bio && (
          <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">{profile.bio}</p>
        )}
        {/* Skills chips */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {profile.skills.map((s) => (
              <span key={s} className="px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-semibold text-ink-soft border border-white/[0.08]">
                {s}
              </span>
            ))}
          </div>
        )}
        {/* Social links */}
        {profile.links && (profile.links.github || profile.links.linkedin || profile.links.instagram || profile.links.portfolio) && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {profile.links.github && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>🐙</span> {profile.links.github}
              </span>
            )}
            {profile.links.linkedin && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>💼</span> {profile.links.linkedin}
              </span>
            )}
            {profile.links.instagram && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>📸</span> @{profile.links.instagram}
              </span>
            )}
            {profile.links.portfolio && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] rounded-full text-[11px] text-ink-mute border border-white/[0.07]">
                <span>🌐</span> {profile.links.portfolio}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Social Actions */}
      <div className="flex gap-2.5 mb-3">
        <button
          onClick={() => setEditProfileOpen(true)}
          className="w-full py-2.5 text-xs font-bold rounded-xl bg-white/[0.07] hover:bg-white/10 active:scale-[0.98] transition text-ink text-center"
        >
          Edit Profile
        </button>
      </div>

      {profile?.verified && (
        <div className="w-full mb-4 py-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
          ✓ Verified Student ID
        </div>
      )}

      {/* MY LISTINGS */}
      {data.listings && data.listings.length > 0 && (
        <div id="my-listings-section" className="mb-6 text-left">
          <SectionHeader title="My Listings" />
          <div className="space-y-2">
            {data.listings.map((listing) => (
              <div 
                key={listing.id} 
                onClick={() => setSelectedListingToEdit(listing)}
                className="card p-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] active:scale-[0.99] transition"
              >
                {listing.image ? (
                  <img src={listing.image} alt={listing.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl shrink-0">🛒</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{listing.title}</p>
                  <p className="text-[11px] text-ink-mute mt-0.5">₹{listing.price}{listing.priceUnit ? ` / ${listing.priceUnit}` : ""}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-mute shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK SNAPSHOT */}
      <SectionHeader title="Academic Snapshot" />
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <Snap
          label="Attendance"
          value={overall.held === 0 ? "—" : Math.round(overall.percentage) + "%"}
        />
        <Snap label="Subjects" value={String(subjects.length)} />
        <Snap label="To-dos" value={String(openDeadlines)} />
      </div>

      {/* BUSINESS CARD / BRIDGE */}
      {business?.registered ? (
        <div className="mb-6">
          <SectionHeader title="Business" />
          <button
            onClick={onOpenBusiness}
            className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.99] transition text-left"
            style={{ background: "linear-gradient(135deg, #1a0533 0%, #3b0764 45%, #7c3aed 100%)" }}
          >
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl shrink-0">
              {business.type === "sell" ? "🛍️" : business.type === "service" ? "🛠️" : "🎓"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{business.name}</p>
              <p className="text-white/55 text-xs mt-0.5">
                {business.type === "sell" ? "Selling" : business.type === "service" ? "Services" : "Club / Event"} · Tap to open dashboard
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 shrink-0" />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenBusiness}
          className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition text-left mb-6 shadow-sm"
          style={{ background: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #c026d3 100%)" }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <SparkIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[15px]">Got a side hustle?</p>
            <p className="text-white/75 text-xs">Start selling on Cmpus — it&apos;s free</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
        </button>
      )}

      {/* GROUPED SETTINGS */}
      <SectionHeader title="Settings" />
      <div className="space-y-6 mb-6 text-left">
        {/* Account Group */}
        <div>
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2 pl-1">Account</p>
          <div className="card divide-y divide-white/[0.04] shadow-sm">
            <button onClick={() => setEditProfileOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Edit Profile</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </button>
            <div className="w-full flex items-center justify-between p-3.5">
              <div>
                <span className="text-sm text-ink-soft font-semibold block">Private Account</span>
                <span className="text-[10px] text-ink-mute">Approval needed for new followers</span>
              </div>
              <button
                onClick={togglePrivacy}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${isPrivate ? "bg-brand-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${isPrivate ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
            {!profile?.verified && (
              <button onClick={() => setVerifyOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
                <span className="text-sm text-brand-300 font-semibold">🛡️ Verify Student ID</span>
                <ChevronRight className="w-4 h-4 text-brand-300" />
              </button>
            )}
          </div>
        </div>

        {/* Academic Group */}
        <div>
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2 pl-1">Academic</p>
          <div className="card divide-y divide-white/[0.04] shadow-sm">
            <button onClick={() => setAcademicSettingsOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Attendance target</span>
              <span className="flex items-center gap-1 text-sm font-bold text-ink">
                {Math.round(profile.attendanceTarget * 100) + "%"}
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </span>
            </button>
            <button onClick={() => setAcademicSettingsOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Grade system</span>
              <span className="flex items-center gap-1 text-sm font-bold text-ink">
                {profile.gradeSystem === "percentage" ? "Percentage" : "10-point GPA"}
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </span>
            </button>
          </div>
        </div>

        {/* Money Group */}
        <div>
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2 pl-1">Money</p>
          <div className="card shadow-sm">
            <button onClick={() => setMoneySettingsOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Monthly budget</span>
              <span className="flex items-center gap-1 text-sm font-bold text-ink">
                {profile.monthlyBudget ? "₹" + profile.monthlyBudget : "Not set"}
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </span>
            </button>
          </div>
        </div>

        {/* Notifications Group */}
        <div>
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2 pl-1">Notifications & Sound</p>
          <div className="card divide-y divide-white/[0.04] shadow-sm">
            <button onClick={() => setRemindersOpen(true)} className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Reminders</span>
              <span className="flex items-center gap-1 text-sm font-bold text-ink">
                {data.reminders?.enabled ? "On" : "Off"}
                <ChevronRight className="w-4 h-4 text-ink-mute" />
              </span>
            </button>
            <div className="w-full flex items-center justify-between p-3.5">
              <div>
                <span className="text-sm text-ink-soft font-semibold block">Sound Effects</span>
                <span className="text-[10px] text-ink-mute">Audio haptics for interactions</span>
              </div>
              <button
                onClick={() => {
                  update((d) => {
                    d.profile.soundEnabled = d.profile.soundEnabled === false ? true : false;
                  });
                }}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${profile.soundEnabled !== false ? "bg-brand-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${profile.soundEnabled !== false ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* About Group */}
        <div>
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider mb-2 pl-1">About</p>
          <div className="card divide-y divide-white/[0.04] shadow-sm">
            <div className="flex items-center justify-between p-3.5">
              <span className="text-sm text-ink-soft font-semibold">App version</span>
              <span className="text-xs text-ink-mute font-bold flex items-center gap-1.5">
                Cmpus v1.0
                <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[8px] font-black tracking-widest uppercase border border-brand-500/30">BETA</span>
              </span>
            </div>
            <a href="/terms" className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Terms of Service</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </a>
            <a href="/privacy" className="w-full flex items-center justify-between p-3.5 text-left active:bg-white/[0.04]">
              <span className="text-sm text-ink-soft font-semibold">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-ink-mute" />
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <p className="text-[10px] font-bold text-red-500/80 uppercase tracking-wider mb-2 pl-1">Danger Zone</p>
          <div className="card divide-y divide-white/[0.04] border border-red-500/10 shadow-sm">
            <button
              onClick={async () => {
                if (confirm("Are you sure you want to sign out?")) {
                  await signOut();
                }
              }}
              className="w-full p-3.5 text-left active:bg-white/[0.04] text-red-400 font-semibold text-sm flex items-center justify-between"
            >
              <span>Sign Out</span>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
            <button
              onClick={() => {
                if (confirm("Reset all data? This clears everything on this device.")) {
                  reset();
                }
              }}
              className="w-full p-3.5 text-left active:bg-white/[0.04] text-red-500 font-bold text-sm flex items-center justify-between"
            >
              <span>Reset all data</span>
              <ChevronRight className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-ink-mute text-[10px] mt-2 mb-1">
        Powered by <span className="font-semibold text-brand-500">Footfall &amp; Co</span>
      </p>
      <p className="text-center text-ink-mute/60 text-[9px] mb-8 tracking-wide">
        <span className="font-bold text-brand-400">BETA</span>
        {" · "}
        {process.env.NEXT_PUBLIC_BUILD_TIME
          ? `Build ${new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
          : "Build —"}
      </p>

      {/* SHEETS & DIALOGS */}
      <RemindersSheet
        open={remindersOpen}
        onClose={() => setRemindersOpen(false)}
      />
      <AcademicSettingsSheet
        open={academicSettingsOpen}
        onClose={() => setAcademicSettingsOpen(false)}
      />
      <MoneySettingsSheet
        open={moneySettingsOpen}
        onClose={() => setMoneySettingsOpen(false)}
      />
      <EditProfileSheet
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
      <VerifyIdSheet
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        name={profile?.name || ""}
        college={profile?.college || ""}
        onVerified={() => refreshProfile()}
      />
      <SocialListSheet
        open={socialSheetOpen}
        onClose={() => setSocialSheetOpen(false)}
        type={socialSheetType}
        people={socialPeople}
        loading={socialLoading}
        onToggleFollow={handleSocialAction}
        onOpenClassmate={(p) => setSelectedClassmate(p)}
        onRemoveFollower={handleRemoveFollower}
      />
      {selectedClassmate && (
        <UserProfileView
          peer={selectedClassmate}
          open={!!selectedClassmate}
          onClose={() => setSelectedClassmate(null)}
          demo={isDemo()}
          currentUserId={user?.id}
          onSwitchTab={onSwitchTab}
          onOpenDm={(p) => {
            setSelectedClassmate(null);
            if (onSwitchTab) onSwitchTab("messages");
          }}
          followState={selectedClassmate.followed ? "following" : "none"}
          onFollow={async (pId, newState) => {
            const isFollowedNow = newState === "following" || newState === "mutual";
            const wasFollowed = !!selectedClassmate.followed;
            if (isFollowedNow !== wasFollowed) {
              await handleSocialAction(selectedClassmate);
            }
          }}
        />
      )}
      {selectedListingToEdit && (
        <EditListingSheet
          open={!!selectedListingToEdit}
          onClose={() => setSelectedListingToEdit(null)}
          listing={selectedListingToEdit}
        />
      )}
    </div>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3 text-center shadow-sm">
      <p className="text-lg font-black text-ink tabular-nums">{value}</p>
      <p className="text-[10px] text-ink-mute font-bold mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function AcademicSettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const [target, setTarget] = useState(
    Math.round(data.profile.attendanceTarget * 100)
  );

  useEffect(() => {
    if (open) {
      setTarget(Math.round(data.profile.attendanceTarget * 100));
    }
  }, [open, data.profile]);

  function save() {
    update((d) => {
      d.profile.attendanceTarget = target / 100;
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Academic Settings">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold text-ink-soft mb-2 block">
            Attendance target — {target}%
          </label>
          <input
            type="range"
            min={50}
            max={90}
            step={5}
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-soft mb-2 block">
            Grade system
          </label>
          <div className="flex gap-2">
            {(["gpa10", "percentage"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() =>
                  update((d) => {
                    d.profile.gradeSystem = g;
                  })
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                  data.profile.gradeSystem === g
                    ? "bg-brand-500 text-white"
                    : "bg-white/[0.07] text-ink-soft"
                }`}
              >
                {g === "gpa10" ? "10-point GPA" : "Percentage"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={save} className="btn-primary w-full py-2.5 mt-4">
          Save Academic Settings
        </button>
      </div>
    </Sheet>
  );
}

function MoneySettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const [budget, setBudget] = useState(
    data.profile.monthlyBudget ? String(data.profile.monthlyBudget) : ""
  );

  useEffect(() => {
    if (open) {
      setBudget(data.profile.monthlyBudget ? String(data.profile.monthlyBudget) : "");
    }
  }, [open, data.profile]);

  function save() {
    update((d) => {
      d.profile.monthlyBudget = Number(budget) || 0;
    });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Money Settings">
      <div className="space-y-4 text-left">
        <div>
          <label className="text-xs font-bold text-ink-soft mb-2 block uppercase tracking-wide">
            Monthly budget (₹)
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="input text-sm"
            placeholder="e.g. 5000 — leave empty for none"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <button onClick={save} className="btn-primary w-full py-2.5 mt-2">
          Save Budget
        </button>
      </div>
    </Sheet>
  );
}

function EditProfileSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [course, setCourse] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const emojis = ["👨‍💻", "👩‍💻", "🎓", "🌟", "🎨", "🚀", "🍕", "🎸", "🐱", "🦁", "🥤", "🛹"];

  useEffect(() => {
    if (open && data.profile) {
      setName(data.profile.name || "");
      setUsername(data.profile.username || "");
      setUsernameStatus("idle");
      setCollege(data.profile.college || "");
      setYear(data.profile.year ? String(data.profile.year) : "");
      setCourse(data.profile.course || "B.Tech Computer Science");
      setAvatar(data.profile.avatar || "👨‍💻");
      setBio(data.profile.bio || "");
      setSkills(data.profile.skills || []);
      setSkillInput("");
      setGithub(data.profile.links?.github || "");
      setLinkedin(data.profile.links?.linkedin || "");
      setInstagram(data.profile.links?.instagram || "");
      setPortfolio(data.profile.links?.portfolio || "");
      setAvatarFile(null);
    }
  }, [open, data.profile]);

  // Username validation with 400ms debounce
  function handleUsernameChange(val: string) {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (cleaned === (data.profile?.username || "")) {
      setUsernameStatus("idle");
      return;
    }
    const re = /^[a-z0-9_]{3,20}$/;
    if (!cleaned || !re.test(cleaned)) {
      setUsernameStatus(cleaned.length === 0 ? "idle" : "invalid");
      return;
    }
    setUsernameStatus("checking");
    usernameTimerRef.current = setTimeout(async () => {
      if (isDemo()) {
        setUsernameStatus(cleaned === "arjun_s" ? "taken" : "available");
        return;
      }
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", cleaned)
        .neq("id", user?.id || "")
        .maybeSingle();
      setUsernameStatus(existing ? "taken" : "available");
    }, 400);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkillInput("");
  }

  function removeSkill(s: string) {
    setSkills(skills.filter((x) => x !== s));
  }

  async function save() {
    if (!name.trim()) return;
    const parsedYear = Number(year) || 1;
    const trimmedBio = bio.trim();
    const trimmedSkills = skills.map((s) => s.trim()).filter(Boolean);

    const hasLinks = github.trim() || linkedin.trim() || instagram.trim() || portfolio.trim();
    const links = {
      github: github.trim(),
      linkedin: linkedin.trim(),
      instagram: instagram.trim(),
      portfolio: portfolio.trim(),
    };

    let finalAvatar = avatar;
    if (avatarFile && !isDemo() && user) {
      try {
        finalAvatar = await uploadPhoto("avatars", `${user.id}/avatar-${Date.now()}.png`, avatarFile);
      } catch (err) {
        console.error("Avatar upload failed, utilizing fallback:", err);
      }
    }

    update((d) => {
      d.profile.name = name.trim();
      d.profile.college = college.trim() || undefined;
      d.profile.year = parsedYear;
      d.profile.course = course.trim();
      d.profile.avatar = finalAvatar;
      d.profile.bio = trimmedBio;
      d.profile.skills = trimmedSkills;
      d.profile.links = hasLinks ? links : undefined;
    });

    if (!isDemo() && user) {
      const profileUpdate: Record<string, any> = {
        name: name.trim(),
        college: college.trim(),
        year: parsedYear,
        course: course.trim(),
        bio: trimmedBio,
        skills: trimmedSkills,
        links: hasLinks ? (links as Record<string, string>) : {},
        avatar_url: finalAvatar,
      };
      // Save username if changed and valid
      const usernameChanged = username !== (data.profile?.username || "");
      if (usernameChanged && (usernameStatus === "available" || usernameStatus === "idle")) {
        profileUpdate.username = username || undefined;
      }
      dbUpdateProfile(user.id, profileUpdate);
    }

    onClose();
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4 text-left">
        {/* Username */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute text-sm font-medium select-none">@</span>
            <input
              className={`input text-sm pl-8 pr-10 transition-colors ${
                usernameStatus === "available" ? "border-green-500/40 focus:border-green-500/60" :
                usernameStatus === "taken" ? "border-red-500/40 focus:border-red-500/60" :
                usernameStatus === "invalid" ? "border-amber-500/40 focus:border-amber-500/60" :
                ""
              }`}
              placeholder="your_username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              maxLength={20}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === "checking" && (
                <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block" />
              )}
              {usernameStatus === "available" && (
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 inline-flex items-center justify-center text-[10px]">✓</span>
              )}
              {usernameStatus === "taken" && (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 inline-flex items-center justify-center text-[10px] font-bold">!</span>
              )}
              {usernameStatus === "invalid" && (
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 inline-flex items-center justify-center text-[10px] font-bold">⚠</span>
              )}
            </span>
          </div>
          <p className={`text-[10px] mt-1 font-medium transition-colors ${
            usernameStatus === "available" ? "text-green-400" :
            usernameStatus === "taken" ? "text-red-400" :
            usernameStatus === "invalid" ? "text-amber-400" :
            usernameStatus === "checking" ? "text-ink-mute" :
            "text-transparent"
          }`}>
            {usernameStatus === "checking" && "Checking availability…"}
            {usernameStatus === "available" && "Username is available!"}
            {usernameStatus === "taken" && "Username is already taken"}
            {usernameStatus === "invalid" && "3–20 chars: lowercase, numbers, underscores only"}
            {usernameStatus === "idle" && "\u200b"}
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Display Name
          </label>
          <input
            className="input text-sm"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* College */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            College
          </label>
          <input
            className="input text-sm"
            placeholder="e.g. Delhi Technological University"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
        </div>

        {/* Year */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Year
          </label>
          <input
            type="number"
            inputMode="numeric"
            className="input text-sm"
            placeholder="e.g. 1, 2, 3, 4"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        {/* Course */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Course / Department
          </label>
          <input
            className="input text-sm"
            placeholder="e.g. B.Tech Computer Science"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Bio
          </label>
          <textarea
            className="input text-sm resize-none"
            placeholder="A short intro about you..."
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
          />
          <p className="text-[10px] text-ink-mute mt-1 text-right">{bio.length}/150</p>
        </div>

        {/* Skills */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Skills
          </label>
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1"
              placeholder="Add a skill (e.g. React)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-3 py-2 bg-brand-500/20 text-brand-300 rounded-xl text-sm font-bold hover:bg-brand-500/30 transition shrink-0"
            >
              Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => removeSkill(s)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] rounded-full text-[11px] font-semibold text-ink-soft border border-white/[0.08] hover:border-red-400/40 hover:text-red-400 transition"
                >
                  {s} <span className="text-[10px]">✕</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Social Links
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">🐙</span>
              <input className="input text-sm flex-1" placeholder="GitHub username" value={github} onChange={(e) => setGithub(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">💼</span>
              <input className="input text-sm flex-1" placeholder="LinkedIn username" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">📸</span>
              <input className="input text-sm flex-1" placeholder="Instagram handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base w-6 text-center shrink-0">🌐</span>
              <input className="input text-sm flex-1" placeholder="Portfolio URL" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-2">
            Select Avatar / Emoji
          </label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatar(emoji)}
                className={`h-11 rounded-xl flex items-center justify-center text-xl transition bg-white/[0.04] ${
                  avatar === emoji ? "ring-2 ring-brand-500 bg-brand-500/15" : "hover:bg-white/[0.07]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          
          <div className="text-center py-1">
            <span className="text-xs text-ink-mute block mb-2">OR</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="avatar-file-upload"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="avatar-file-upload"
              className="inline-block px-4 py-2 bg-white/[0.07] hover:bg-white/10 rounded-xl text-xs font-bold text-ink-soft cursor-pointer transition active:scale-95"
            >
              📷 Upload custom photo
            </label>
          </div>

          {avatar && avatar.startsWith("data:") && (
            <div className="mt-3 flex items-center justify-center gap-3 bg-white/[0.04] p-2.5 rounded-2xl">
              <img src={avatar} alt="Preview" className="w-12 h-12 rounded-full object-cover border border-white/[0.14]" />
              <span className="text-xs font-semibold text-ink-soft">Custom avatar selected</span>
              <button 
                type="button"
                onClick={() => setAvatar("👨‍💻")} 
                className="text-red-500 font-bold text-xs ml-auto"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        <button onClick={save} disabled={!name.trim()} className="btn-primary w-full py-2.5 mt-2">
          Save Changes
        </button>
      </div>
    </Sheet>
  );
}

function SocialListSheet({
  open,
  onClose,
  type,
  people,
  loading,
  onToggleFollow,
  onOpenClassmate,
  onRemoveFollower,
}: {
  open: boolean;
  onClose: () => void;
  type: "followers" | "following";
  people: any[];
  loading: boolean;
  onToggleFollow: (person: any) => Promise<void>;
  onOpenClassmate: (person: any) => void;
  onRemoveFollower?: (person: any) => void;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  return (
    <Sheet open={open} onClose={onClose} title={type === "followers" ? "Followers" : "Following"}>
      {loading ? (
        <div className="text-center py-8 text-xs text-ink-mute font-bold">Loading...</div>
      ) : people.length === 0 ? (
        <div className="text-center py-8 text-xs text-ink-mute font-bold">
          {type === "followers" ? "No followers yet." : "You are not following anyone."}
        </div>
      ) : (
        <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar text-left">
          {people.map((person) => (
            <div key={person.id} className="flex items-center justify-between py-2 border-b border-white/[0.03]">
              <div
                onClick={() => {
                  onClose();
                  onOpenClassmate(person);
                }}
                className="flex items-center gap-3 cursor-pointer active:opacity-75 transition flex-1 min-w-0"
              >
                <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-xl shrink-0 overflow-hidden">
                  {person.avatar && person.avatar.startsWith("data:") ? (
                    <img src={person.avatar} alt={person.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span>{person.avatar || "🎓"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-ink truncate">{person.name}</p>
                    {person.verified && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 bg-brand-500 text-white rounded-full text-[7px] shrink-0">
                        ✓
                      </span>
                    )}
                  </div>
                  {person.username && <p className="text-xs text-ink-mute truncate">@{person.username}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {type === "followers" && onRemoveFollower && (
                  removingId === person.id ? (
                    <button
                      type="button"
                      onClick={() => { onRemoveFollower(person); setRemovingId(null); }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 transition"
                    >
                      Sure?
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRemovingId(person.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/[0.04] text-ink-mute border border-white/[0.06] transition"
                    >
                      Remove
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => onToggleFollow(person)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition shrink-0 ${
                    person.followed
                      ? "bg-white/[0.06] text-brand-300 border border-brand-500/20"
                      : "bg-brand-500 text-white"
                  }`}
                >
                  {person.followed ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}



function EditListingSheet({
  open,
  onClose,
  listing,
}: {
  open: boolean;
  onClose: () => void;
  listing: any;
}) {
  const { update } = useStore();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && listing) {
      setTitle(listing.title || "");
      setPrice(String(listing.price || ""));
      setPriceUnit(listing.priceUnit || "");
      setDescription(listing.description || "");
      setImage(listing.image || "");
    }
  }, [open, listing]);

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const parsedPrice = Number(price) || 0;
      update((d) => {
        d.listings = d.listings.map((l) =>
          l.id === listing.id
            ? { ...l, title: title.trim(), price: parsedPrice, priceUnit: priceUnit.trim(), description: description.trim(), image: image.trim() }
            : l
        );
      });

      if (!isDemo() && user) {
        await supabase.from("listings")
          .update({
            title: title.trim(),
            price: parsedPrice,
            price_unit: priceUnit.trim() || null,
            description: description.trim(),
            images: image.trim() ? [image.trim()] : []
          })
          .eq("id", listing.id)
          .eq("user_id", user.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this listing permanently?")) return;
    setLoading(true);
    try {
      update((d) => {
        d.listings = d.listings.filter((l) => l.id !== listing.id);
      });

      if (!isDemo() && user) {
        await supabase.from("listings")
          .delete()
          .eq("id", listing.id)
          .eq("user_id", user.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Listing">
      <div className="space-y-4 text-left">
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Listing Title
          </label>
          <input
            className="input text-sm"
            placeholder="What are you offering?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
              Price (₹)
            </label>
            <input
              type="number"
              className="input text-sm"
              placeholder="0 = Ask"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
              Unit (e.g. per hr)
            </label>
            <input
              className="input text-sm"
              placeholder="optional"
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Description
          </label>
          <textarea
            className="input text-sm resize-none"
            placeholder="Details, delivery, contact, etc..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wide block mb-1">
            Listing Photo
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="listing-edit-photo"
              onChange={handlePhotoUpload}
            />
            <label
              htmlFor="listing-edit-photo"
              className="px-3 py-2 bg-white/[0.07] hover:bg-white/10 rounded-xl text-xs font-bold text-ink-soft cursor-pointer transition"
            >
              Select Photo
            </label>
            {image && (
              <img src={image} className="w-10 h-10 object-cover rounded-lg border border-white/10" alt="Preview" />
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition rounded-xl font-bold text-sm"
          >
            Delete Listing
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !title.trim()}
            className="btn-primary flex-1 py-2.5"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Sheet>
  );
}

interface VerifyIdSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  college: string;
  onVerified: () => void;
}

function VerifyIdSheet({ open, onClose, name, college, onVerified }: VerifyIdSheetProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState(0); // 0 = upload, 1 = scanning
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setStep(0);
      setLogs([]);
    }
  }, [open]);

  useEffect(() => {
    if (step !== 1 || !open) return;

    const logsSequence = [
      { text: "[AI] Initializing OCR vision engine...", delay: 0 },
      { text: "[AI] Analyzing image structure...", delay: 600 },
      { text: `[AI] Extracted: Name = ${name}`, delay: 1200 },
      { text: `[AI] Extracted: College = ${college}`, delay: 1800 },
      { text: "[AI] Matching records... ✓ SUCCESS", delay: 2400 },
    ];

    setLogs([]);
    const timers: NodeJS.Timeout[] = [];

    logsSequence.forEach((item) => {
      const t = setTimeout(() => {
        setLogs((prev) => [...prev, item.text]);
      }, item.delay);
      timers.push(t);
    });

    const finishTimer = setTimeout(() => {
      handleVerifyComplete();
    }, 2500);
    timers.push(finishTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [step, open]);

  async function handleVerifyComplete() {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verified: true })
        .eq("id", user.id);
      
      if (error) {
        console.error(error);
        alert("Verification failed: " + error.message);
      } else {
        triggerConfetti();
        onVerified();
      }
    } catch (err) {
      console.error(err);
    } finally {
      onClose();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep(1);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Verify Student ID">
      <div className="space-y-4">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-xs text-ink-mute leading-relaxed">
              Upload a clear photo of your student ID card. Our AI OCR system will scan the card to verify your identity and institution status instantly.
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-brand-500/30 hover:border-brand-500/60 transition duration-200 rounded-2xl aspect-[16/10] flex flex-col items-center justify-center cursor-pointer bg-white/[0.02] hover:bg-white/[0.04]"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="text-3xl mb-2">🛡️</span>
              <span className="text-sm font-bold text-ink">Upload ID Photo</span>
              <span className="text-[10px] text-ink-mute mt-1">PNG, JPG or JPEG files</span>
            </div>
          </div>
        )}

        {step === 1 && file && (
          <div className="space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black border border-white/10">
              <img
                src={URL.createObjectURL(file)}
                alt="ID Preview"
                className="w-full h-full object-cover"
              />
              {/* Laser Line Scanner */}
              <div
                className="absolute inset-x-0 h-0.5 bg-brand-400 opacity-80 animate-bounce"
                style={{ top: "50%" }}
              />
            </div>

            <div className="bg-[#0c0c0e]/95 border border-white/[0.07] rounded-2xl p-4 font-mono text-xs text-green-400 min-h-[140px] flex flex-col gap-1.5 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className="animate-fade-in">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function RemindersSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, update } = useStore();
  const { user } = useAuth();
  const settings = data.reminders || {
    enabled: false,
    classReminders: true,
    classLeadMin: 15,
    deadlineReminders: true,
    deadlineLeadDays: 1,
    attendanceNudge: true,
    dailyAgenda: false,
  };

  const [enabled, setEnabled] = useState(settings.enabled);
  const [classReminders, setClassReminders] = useState(settings.classReminders);
  const [classLeadMin, setClassLeadMin] = useState(settings.classLeadMin);
  const [deadlineReminders, setDeadlineReminders] = useState(settings.deadlineReminders);
  const [deadlineLeadDays, setDeadlineLeadDays] = useState(settings.deadlineLeadDays);
  const [attendanceNudge, setAttendanceNudge] = useState(settings.attendanceNudge);
  const [dailyAgenda, setDailyAgenda] = useState(settings.dailyAgenda);

  useEffect(() => {
    if (open && data.reminders) {
      setEnabled(data.reminders.enabled);
      setClassReminders(data.reminders.classReminders);
      setClassLeadMin(data.reminders.classLeadMin);
      setDeadlineReminders(data.reminders.deadlineReminders);
      setDeadlineLeadDays(data.reminders.deadlineLeadDays);
      setAttendanceNudge(data.reminders.attendanceNudge);
      setDailyAgenda(data.reminders.dailyAgenda);
    }
  }, [open, data.reminders]);

  async function handleToggleMaster(val: boolean) {
    if (val) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications.");
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setEnabled(true);
      } else {
        alert("Notification permission was denied. Please enable notifications in your browser settings.");
        setEnabled(false);
      }
    } else {
      setEnabled(false);
    }
  }

  function save() {
    update((d) => {
      d.reminders = {
        enabled,
        classReminders,
        classLeadMin,
        deadlineReminders,
        deadlineLeadDays,
        attendanceNudge,
        dailyAgenda,
      };
    });

    if (user) {
      if (enabled) {
        subscribeUserToPush(user.id);
      } else {
        unsubscribeUserFromPush(user.id);
      }
    }

    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Reminders">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3.5 bg-white/[0.04] rounded-2xl">
          <div>
            <p className="text-sm font-bold text-ink">Enable Reminders</p>
            <p className="text-[10px] text-ink-mute">
              Get browser notifications for schedule
            </p>
          </div>
          <button
            onClick={() => handleToggleMaster(!enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
              enabled ? "bg-brand-500" : "bg-black/15"
            }`}
          >
            <span
              className={`w-[18px] h-[18px] rounded-full bg-white absolute transition-transform shadow ${
                enabled ? "translate-x-[22px]" : "translate-x-1"
              }`}
              style={{ width: "18px", height: "18px" }}
            />
          </button>
        </div>

        {enabled && (
          <div className="space-y-3.5 animate-fade-in text-left">
            {/* Class Reminders */}
            <div className="card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Class Alerts</p>
                  <p className="text-[10px] text-ink-mute">
                    Before each class slot begins
                  </p>
                </div>
                <button
                  onClick={() => setClassReminders(!classReminders)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                    classReminders ? "bg-brand-500" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                      classReminders ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ width: "14px", height: "14px" }}
                  />
                </button>
              </div>
              {classReminders && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-ink-soft">Lead time:</span>
                  <select
                    className="input py-1 px-2 text-xs w-[120px]"
                    value={classLeadMin}
                    onChange={(e) => setClassLeadMin(Number(e.target.value))}
                  >
                    <option value={5}>5 min before</option>
                    <option value={10}>10 min before</option>
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                  </select>
                </div>
              )}
            </div>

            {/* Deadline Reminders */}
            <div className="card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">Deadline Alerts</p>
                  <p className="text-[10px] text-ink-mute">
                    For exams and assignments
                  </p>
                </div>
                <button
                  onClick={() => setDeadlineReminders(!deadlineReminders)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                    deadlineReminders ? "bg-brand-500" : "bg-black/15"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                      deadlineReminders ? "translate-x-5" : "translate-x-1"
                    }`}
                    style={{ width: "14px", height: "14px" }}
                  />
                </button>
              </div>
              {deadlineReminders && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-xs text-ink-soft">Lead time:</span>
                  <select
                    className="input py-1 px-2 text-xs w-[120px]"
                    value={deadlineLeadDays}
                    onChange={(e) => setDeadlineLeadDays(Number(e.target.value))}
                  >
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before</option>
                  </select>
                </div>
              )}
            </div>

            {/* Attendance Nudge */}
            <div className="card p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-ink">Attendance Nudge</p>
                <p className="text-[10px] text-ink-mute">
                  Nudge at 6:00 PM if attendance is unmarked
                </p>
              </div>
              <button
                onClick={() => setAttendanceNudge(!attendanceNudge)}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                  attendanceNudge ? "bg-brand-500" : "bg-black/15"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                    attendanceNudge ? "translate-x-5" : "translate-x-1"
                  }`}
                  style={{ width: "14px", height: "14px" }}
                />
              </button>
            </div>

            {/* Daily Agenda */}
            <div className="card p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-sm font-bold text-ink">Daily Agenda</p>
                <p className="text-[10px] text-ink-mute">
                  Show today's agenda banner in the morning
                </p>
              </div>
              <button
                onClick={() => setDailyAgenda(!dailyAgenda)}
                className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                  dailyAgenda ? "bg-brand-500" : "bg-black/15"
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute transition-transform shadow ${
                    dailyAgenda ? "translate-x-5" : "translate-x-1"
                  }`}
                  style={{ width: "14px", height: "14px" }}
                />
              </button>
            </div>
          </div>
        )}

        <button onClick={save} className="btn-primary w-full py-2.5">
          Save Settings
        </button>
        <p className="text-center text-[10px] text-ink-mute mt-4 opacity-60 tracking-wide">
          BETA · Build {process.env.NEXT_PUBLIC_BUILD_TIME
            ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "—"}
        </p>
      </div>
    </Sheet>
  );
}
