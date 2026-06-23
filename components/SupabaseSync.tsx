"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "./store";
import { dbLoadAll } from "@/lib/dbActions";
import { isDemo } from "@/lib/config";

export default function SupabaseSync() {
  const { user } = useAuth();
  const { update } = useStore();
  const loaded = useRef(false);

  useEffect(() => {
    if (!user || isDemo() || loaded.current) return;
    loaded.current = true;
    dbLoadAll(user.id, update);
  }, [user]);

  return null;
}
