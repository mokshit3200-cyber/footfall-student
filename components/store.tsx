"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppData, emptyData } from "@/lib/types";
import { isDemo } from "@/lib/config";
import { buildDemoData } from "@/lib/demoData";

const KEY = isDemo() ? "footfall-student-demo-v1" : "footfall-student-data-v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface StoreCtx {
  data: AppData;
  ready: boolean;
  update: (fn: (draft: AppData) => void) => void;
  reset: () => void;
  uid: () => string;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData({
          ...emptyData,
          ...parsed,
          profile: {
            ...emptyData.profile,
            ...(parsed.profile || {}),
          },
          reminders: {
            ...emptyData.reminders,
            ...(parsed.reminders || {}),
          },
          listings: parsed.listings || [],
          classmates: parsed.classmates || emptyData.classmates,
          notifications: parsed.notifications || [],
        });
      } else if (isDemo()) {
        // first visit to the demo link → seed a fully populated app
        setData(buildDemoData());
      }
    } catch {
      /* ignore corrupt store */
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* quota / private mode — ignore */
    }
  }, [data]);

  function update(fn: (draft: AppData) => void) {
    setData((prev) => {
      const next: AppData = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }

  function reset() {
    setData(emptyData);
  }

  return (
    <Ctx.Provider value={{ data, ready, update, reset, uid }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
