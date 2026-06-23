export type AppMode = "demo" | "live";

/**
 * Mode resolution order:
 * 1. ?mode=demo or ?mode=live in URL (easiest for sharing demo links)
 * 2. NEXT_PUBLIC_APP_MODE env var (set per Vercel project)
 * 3. SSR fallback = live
 *
 * DEMO → fake seeded data, all features visible, no login required
 * LIVE → real Supabase auth + data
 */
export function getMode(): AppMode {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("mode");
    if (param === "demo") return "demo";
    if (param === "live") return "live";
  }

  const env = process.env.NEXT_PUBLIC_APP_MODE;
  if (env === "demo" || env === "live") return env;

  return "live";
}

export const isDemo = () => getMode() === "demo";
