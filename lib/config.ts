export type AppMode = "demo" | "live";

/**
 * Mode resolution:
 * 1. NEXT_PUBLIC_APP_MODE env var wins (set per Vercel project).
 * 2. Else, client-side hostname heuristic: *.vercel.app and localhost = demo,
 *    a real custom domain = live.
 * 3. SSR fallback = live.
 *
 * DEMO  → seeded sample data, all features on, no login.
 * LIVE  → real use, Connect + Marketplace "coming soon", auth gate.
 */
export function getMode(): AppMode {
  const env = process.env.NEXT_PUBLIC_APP_MODE;
  if (env === "demo" || env === "live") return env;

  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h.includes("vercel.app") || h === "localhost" || h === "127.0.0.1") {
      return "demo";
    }
    return "live";
  }
  return "live";
}

export const isDemo = () => getMode() === "demo";
