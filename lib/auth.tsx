"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  college: string;
  course: string;
  year: number;
  avatar_url: string | null;
  bio: string | null;
  skills: string[] | null;
  links: Record<string, string>;
  verified: boolean;
  business_name: string | null;
  business_type: "sell" | "service" | "club" | null;
  business_contact: string | null;
  is_ambassador?: boolean;
  ambassador_role?: string | null;
  global_signup_rank?: number | null;
  campus_signup_rank?: number | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, username, college, course, year, avatar_url, bio, skills, links, verified, business_name, business_type, business_contact, is_ambassador, ambassador_role, global_signup_rank, campus_signup_rank, referral_code, referred_by_code")
      .eq("id", userId)
      .single();
    setProfile(data as Profile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // unblock UI immediately; profile loads in background
      if (session?.user) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  return (
    <Ctx.Provider value={{ user, session, loading, profile, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
