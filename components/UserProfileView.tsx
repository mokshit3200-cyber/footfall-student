"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { isDemo } from "@/lib/config";
import {
  CheckIcon,
  ArrowLeftIcon,
  ChatIcon,
  LockIcon,
  SignalIcon,
} from "./icons";

// Inline simple SVGs for social platforms
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const PortfolioIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

// Demo data for fallback mapping
const DEMO_PROFILES_EXT: Record<string, any> = {
  dp1: {
    bio: "DBMS wizard, open-source enthusiast, part-time barista ☕.",
    links: { github: "arjun_sharma", linkedin: "arjun-sharma-cs", instagram: "arjun.sharma" },
    business_name: "Arjun's Book Store",
    business_type: "sell",
    business_contact: "arjun_books",
    listings: [
      { id: "demo-listing-dp1-1", title: "Introduction to Algorithms (CLRS)", price: 450, image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=60" },
      { id: "demo-listing-dp1-2", title: "Operating System Concepts", price: 300, image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop&q=60" }
    ]
  },
  dp2: {
    bio: "ECE student | Amateur photographer. Always looking for new vibes.",
    links: { instagram: "priya_nair_ece" },
    listings: []
  },
  dp3: {
    bio: "Osmania Commerce. Freelance UI/UX designer. DM for projects.",
    links: { linkedin: "rohan-mehta-design", instagram: "rohanm_design" },
    listings: []
  },
  dp5: {
    bio: "Mech. Passionate about food. Order fresh baked chicken biryani daily!",
    business_name: "Karan's Kitchen",
    business_type: "sell",
    business_contact: "+91 98765 43210",
    listings: [
      { id: "demo-1", title: "Homemade Chicken Biryani", price: 120, image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60" }
    ]
  },
  dp6: {
    bio: "BCA. Full stack developer in training.",
    links: { github: "divya_codes" },
    listings: []
  }
};

function Avatar({ person, size = 10 }: { person: any; size?: number }) {
  const name = person.name || person.business_name || "?";
  const initials = name.trim().split(/\s+/).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const cls = `w-${size} h-${size} rounded-full flex items-center justify-center font-bold text-sm shrink-0`;
  const url = person.avatar_url || person.avatar;
  return url
    ? <img src={url} alt={name} className={`${cls} object-cover border border-white/10`} />
    : <div className={`${cls} bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs`}>{initials}</div>;
}

interface UserProfileViewProps {
  peer: any;
  open: boolean;
  onClose: () => void;
  demo: boolean;
  currentUserId?: string;
  onSwitchTab?: (tab: string) => void;
  onOpenDm?: (peer: any) => void;
  followState?: string;
  onFollow?: (peerId: string, newState: string) => void;
  onAccept?: (followerId: string) => Promise<void> | void;
  onDecline?: (followerId: string) => Promise<void> | void;
  mode?: "view" | "request";
}

export default function UserProfileView({
  peer,
  open,
  onClose,
  demo,
  currentUserId,
  onSwitchTab,
  onOpenDm,
  followState,
  onFollow,
  onAccept,
  onDecline,
  mode = "view",
}: UserProfileViewProps) {
  // --- ALL REACT HOOKS DECLARED AT THE TOP ---
  const [profileData, setProfileData] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [localFollowState, setLocalFollowState] = useState<string>("none");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileBlockConfirming, setProfileBlockConfirming] = useState(false);
  const [isMutual, setIsMutual] = useState<boolean>(false);

  const peerIdRef = useRef<string | null>(null);

  // Sync override followState if passed
  useEffect(() => {
    if (followState) {
      setLocalFollowState(followState);
    }
  }, [followState]);

  // Load profile data
  useEffect(() => {
    if (!open || !peer) return;

    const id = peer.id ?? peer.user_id;
    if (!id) return;

    peerIdRef.current = id;
    setLoading(true);

    if (demo) {
      // ── Demo mode resolution ──
      const ext = DEMO_PROFILES_EXT[id] || {};
      const mergedProfile = {
        ...peer,
        bio: peer.bio || ext.bio || "",
        links: peer.links || ext.links || {},
        business_name: peer.business_name || ext.business_name || null,
        business_type: peer.business_type || ext.business_type || null,
        business_contact: peer.business_contact || ext.business_contact || null,
      };

      setProfileData(mergedProfile);
      setListings(ext.listings || []);

      // Mock follow counts
      if (id === "dp1") {
        setFollowersCount(142);
        setFollowingCount(98);
      } else if (id === "dp2") {
        setFollowersCount(85);
        setFollowingCount(120);
      } else {
        setFollowersCount(42);
        setFollowingCount(28);
      }

      // Mock follow state
      if (!followState) {
        if (id === "dp1" || id === "dp2") {
          setLocalFollowState("mutual");
          setIsMutual(true);
        } else if (id === "dp3") {
          setLocalFollowState("following");
        } else {
          setLocalFollowState("none");
        }
      } else {
        setIsMutual(followState === "mutual");
      }

      setLoading(false);
    } else {
      // ── Live Supabase mode resolution ──
      const loadProfile = async () => {
        try {
          // 1. Get profile data
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, name, username, avatar_url, college, course, year, verified, is_private, skills, links, bio, business_name, business_type, business_contact")
            .eq("id", id)
            .single();

          if (prof) {
            setProfileData((prev: any) => ({ ...prev, ...peer, ...prof }));
          } else {
            setProfileData(peer);
          }

          // 2. RPC for follow counts
          const { data: countsData } = await supabase.rpc("get_follow_counts", { profile_id: id });
          const counts = Array.isArray(countsData) ? countsData[0] : countsData;
          setFollowersCount(counts?.followers ?? 0);
          setFollowingCount(counts?.following ?? 0);

          // 3. Determine follow relationship & mutual flag
          if (currentUserId) {
            const [{ data: outFollow }, { data: inFollow }] = await Promise.all([
              supabase.from("follows").select("status").eq("follower_id", currentUserId).eq("following_id", id).maybeSingle(),
              supabase.from("follows").select("status").eq("following_id", currentUserId).eq("follower_id", id).maybeSingle()
            ]);

            const isMyAccepted = outFollow?.status === "accepted";
            const isTheirAccepted = inFollow?.status === "accepted";
            setIsMutual(isMyAccepted && isTheirAccepted);

            if (!followState) {
              let resolvedState = "none";
              if (isMyAccepted && isTheirAccepted) resolvedState = "mutual";
              else if (isMyAccepted) resolvedState = "following";
              else if (outFollow?.status === "pending") resolvedState = "pending";
              setLocalFollowState(resolvedState);
            }
          }

          // 4. Load active listings
          const { data: lst } = await supabase
            .from("listings")
            .select("id, title, price, images, active, user_id")
            .eq("user_id", id)
            .eq("active", true);

          setListings(lst ?? []);
        } catch (err) {
          console.error("Failed to load profile", err);
        } finally {
          setLoading(false);
        }
      };

      loadProfile();
    }
  }, [open, peer, demo, currentUserId, followState]);

  // Early returns allowed only AFTER hook declarations
  if (!open || !peer) return null;

  const resolvedProfile = profileData || peer;
  const personId = peer.id ?? peer.user_id;

  const isPrivate = resolvedProfile.is_private ?? false;
  // If we are looking at their incoming request, bypass the lock wall so we can inspect them
  const canSeePrivate = mode === "request" || !isPrivate || localFollowState === "following" || localFollowState === "mutual";

  const skills: string[] = resolvedProfile.skills || [];
  const links: Record<string, string> = resolvedProfile.links || {};

  const handleFollowToggle = async () => {
    if (demo) {
      let newState = "none";
      if (localFollowState === "none") {
        newState = isPrivate ? "pending" : "following";
      }
      setLocalFollowState(newState);
      setIsMutual(newState === "mutual");
      onFollow?.(personId, newState);
      return;
    }

    if (!currentUserId) return;

    if (localFollowState === "none") {
      const status = isPrivate ? "pending" : "accepted";
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: personId,
        status
      });

      if (!error) {
        let newState = isPrivate ? "pending" : "following";
        if (status === "accepted") {
          // check if mutual
          const { data } = await supabase.from("follows")
            .select("status")
            .eq("follower_id", personId)
            .eq("following_id", currentUserId)
            .maybeSingle();

          if (data?.status === "accepted") {
            newState = "mutual";
            setIsMutual(true);
          }
        }
        setLocalFollowState(newState);
        onFollow?.(personId, newState);
      }
    } else {
      const { error } = await supabase.from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", personId);

      if (!error) {
        setLocalFollowState("none");
        setIsMutual(false);
        onFollow?.(personId, "none");
      }
    }
  };

  const handleBlockUser = async () => {
    if (!demo && currentUserId) {
      await supabase.from("blocks").insert({ blocker_id: currentUserId, blocked_id: personId });
    }
    setProfileMenuOpen(false);
    setProfileBlockConfirming(false);
    onClose();
  };

  const timeAgo = (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black animate-fade-in pb-28 overflow-y-auto no-scrollbar">
      {/* Header Sticky Bar */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-white/[0.07] bg-[#0c0c0e]/95 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-white shrink-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="font-bold text-ink flex-1">Profile</span>
        <button
          onClick={() => { setProfileMenuOpen(true); setProfileBlockConfirming(false); }}
          className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/10 active:scale-90 transition flex items-center justify-center text-ink-soft shrink-0"
        >
          <span className="text-lg leading-none font-bold tracking-tighter">⋯</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="px-5 pt-6 space-y-6">
        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <Avatar person={resolvedProfile} size={16} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg font-bold text-ink truncate max-w-[200px]">{resolvedProfile.name}</h2>
              {resolvedProfile.verified && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-brand-500 text-white rounded-full text-[8px] shrink-0">
                  <CheckIcon className="w-3 h-3" />
                </span>
              )}
              {isPrivate && <LockIcon className="w-3.5 h-3.5 text-ink-mute shrink-0" />}
            </div>
            {resolvedProfile.username && (
              <p className="text-sm text-brand-300 font-medium">@{resolvedProfile.username}</p>
            )}
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              {resolvedProfile.college || "University"}
              {resolvedProfile.course ? ` · ${resolvedProfile.course}` : ""}
              {resolvedProfile.year ? ` · Year ${resolvedProfile.year}` : ""}
            </p>
          </div>
        </div>

        {/* Broadcasting Signal vibe (if active) */}
        {peer.content && (
          <div className="bg-brand-500/[0.03] border border-brand-500/10 rounded-3xl p-5 flex items-start gap-3.5">
            <SignalIcon className="w-5 h-5 text-brand-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-1">Broadcasting</p>
              <p className="text-sm text-ink font-semibold leading-relaxed">"{peer.content}"</p>
              {peer.created_at && (
                <p className="text-[10px] text-ink-mute mt-1.5">{timeAgo(peer.created_at)} ago</p>
              )}
            </div>
          </div>
        )}

        {/* Followers / Following Stats */}
        <div className="flex items-center gap-6 py-3 border-y border-white/[0.05]">
          <div>
            <span className="text-sm font-bold text-ink block">{loading ? "..." : followersCount}</span>
            <span className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold">Followers</span>
          </div>
          <div>
            <span className="text-sm font-bold text-ink block">{loading ? "..." : followingCount}</span>
            <span className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold">Following</span>
          </div>
          {isMutual && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400 tracking-wide">
              Mutual
            </span>
          )}
        </div>

        {/* Action Buttons Section */}
        <div className="space-y-3">
          {mode === "request" ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAccept?.(personId)}
                className="flex-1 h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 transition text-white text-sm font-bold flex items-center justify-center"
              >
                Accept Request
              </button>
              <button
                onClick={() => onDecline?.(personId)}
                className="flex-1 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/10 active:scale-95 transition text-ink-soft text-sm font-bold flex items-center justify-center"
              >
                Decline
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {localFollowState === "mutual" && onOpenDm ? (
                <>
                  <button
                    onClick={() => onOpenDm(resolvedProfile)}
                    className="flex-1 h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-95 transition text-white text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <ChatIcon className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                  <button
                    onClick={handleFollowToggle}
                    className="flex-1 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/10 active:scale-95 transition text-brand-300 text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>Following</span>
                    <CheckIcon className="w-4 h-4 text-brand-300" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`w-full h-12 rounded-2xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2 ${
                    localFollowState === "none"
                      ? "bg-brand-500 hover:bg-brand-600 text-white"
                      : "bg-white/[0.05] text-ink-mute border border-white/[0.08]"
                  }`}
                >
                  <span>
                    {localFollowState === "none"
                      ? (isPrivate ? "Request Follow" : "Follow")
                      : localFollowState === "pending"
                      ? "Requested"
                      : "Following"}
                  </span>
                  {localFollowState === "following" && <CheckIcon className="w-4 h-4 text-brand-300" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Private Gate Lock Wall */}
        {!canSeePrivate ? (
          <div className="mt-8 text-center px-4 py-8 border border-white/[0.04] rounded-3xl bg-[#0c0c0e]/30">
            <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-3">
              <LockIcon className="w-7 h-7 text-ink-mute" />
            </div>
            <p className="text-sm font-bold text-ink">This account is private</p>
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              Follow to see their skills, links, and business storefront
            </p>
          </div>
        ) : (
          <>
            {/* Bio */}
            {resolvedProfile.bio && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Bio</p>
                <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">{resolvedProfile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: string) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs font-medium text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {Object.values(links).some(Boolean) && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Links</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(links).map(([platform, handle]) => {
                    if (!handle) return null;
                    let url = handle;
                    let icon = <PortfolioIcon className="w-4 h-4" />;
                    let name = "Website";

                    if (platform === "instagram") {
                      url = `https://instagram.com/${handle.replace("@", "")}`;
                      icon = <InstagramIcon className="w-4 h-4" />;
                      name = "Instagram";
                    } else if (platform === "linkedin") {
                      url = `https://linkedin.com/in/${handle}`;
                      icon = <LinkedinIcon className="w-4 h-4" />;
                      name = "LinkedIn";
                    } else if (platform === "github") {
                      url = `https://github.com/${handle}`;
                      icon = <GithubIcon className="w-4 h-4" />;
                      name = "GitHub";
                    } else if (platform === "portfolio") {
                      name = "Portfolio";
                    }

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:scale-[0.98] transition text-xs font-semibold text-ink-soft truncate"
                      >
                        <span className="text-ink-mute shrink-0">{icon}</span>
                        <span className="truncate">{name}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Business storefront */}
            {(resolvedProfile.business_name || listings.length > 0) && (
              <div className="space-y-3.5 border-t border-white/[0.05] pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">{resolvedProfile.business_name || "Campus Business"}</h3>
                    {resolvedProfile.business_type && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-[9px] uppercase font-extrabold text-brand-300">
                        {resolvedProfile.business_type}
                      </span>
                    )}
                  </div>
                  {resolvedProfile.business_contact && (
                    <span className="text-xs text-brand-300 font-semibold">{resolvedProfile.business_contact}</span>
                  )}
                </div>

                {listings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-ink-mute uppercase tracking-wider">Shop Items</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                      {listings.map((item) => {
                        const img = item.images?.[0] || item.image;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (onSwitchTab) {
                                // Close first, then redirect
                                onClose();
                                onSwitchTab("market");
                                const params = new URLSearchParams(window.location.search);
                                params.set("tab", "market");
                                params.set("item", item.id);
                                window.history.pushState(null, "", `${window.location.pathname}?${params.toString()}`);
                              }
                            }}
                            className="w-32 shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-2.5 space-y-1.5 cursor-pointer hover:border-white/10 active:scale-[0.98] transition-all"
                          >
                            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/[0.04] relative">
                              {img ? (
                                <img src={img} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-ink-mute">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate">{item.title}</p>
                              <p className="text-[11px] text-brand-300 font-bold mt-0.5">₹{item.price}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Block Confirmation Bottom Sheet */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          onClick={() => { setProfileMenuOpen(false); setProfileBlockConfirming(false); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#111] border-t border-white/[0.08] rounded-t-3xl p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" />
            {profileBlockConfirming ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="font-bold text-ink text-sm">Block {resolvedProfile.name}?</p>
                  <p className="text-xs text-ink-mute mt-1 leading-relaxed">
                    They won't be able to see your vibe signals, send you follow requests, or direct message you.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBlockUser}
                    className="flex-1 h-11 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 transition text-white text-xs font-bold"
                  >
                    Yes, Block
                  </button>
                  <button
                    onClick={() => setProfileBlockConfirming(false)}
                    className="flex-1 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.08] active:scale-95 transition text-ink-soft text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setProfileBlockConfirming(true)}
                  className="w-full h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 active:scale-95 transition text-red-500 text-sm font-bold flex items-center justify-center"
                >
                  Block User
                </button>
                <button
                  onClick={() => setProfileMenuOpen(false)}
                  className="w-full h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/10 active:scale-95 transition text-ink-soft text-sm font-bold flex items-center justify-center"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
