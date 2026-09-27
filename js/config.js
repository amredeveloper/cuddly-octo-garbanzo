/**
 * Cove — Supabase configuration
 * --------------------------------
 * This file is the ONLY place frontend code should hold Supabase credentials.
 *
 * 1. Open https://supabase.com/dashboard and create (or open) a project.
 * 2. Go to: Project Settings → API
 * 3. Copy "Project URL" into SUPABASE_URL below.
 * 4. Copy the public "anon" / "public" key into SUPABASE_ANON_KEY below.
 * 5. Run supabase/schema.sql in the SQL Editor (see README_AR.md).
 * 6. Reload the app.
 *
 * NEVER put the service_role key here. That key bypasses Row Level Security
 * and must stay on a server you control — never in browser code, GitHub, or
 * GitHub Pages.
 *
 * If these two values are left as empty strings, the app shows a setup
 * screen where you can paste them (saved only on this device as a preference).
 */
export const SUPABASE_URL = ""; // e.g. "https://xxxxxxxxxxxx.supabase.co"
export const SUPABASE_ANON_KEY = ""; // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

export const CONFIG = {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
};

/** localStorage key for optional on-device override of the two public values above. */
export const CONFIG_STORAGE_KEY = "cove.supabase.config";

export function looksLikePlaceholder(value) {
  if (!value || typeof value !== "string") return true;
  const v = value.trim();
  if (v.length < 10) return true;
  return /YOUR_|CHANGEME|example|placeholder/i.test(v);
}

export function resolveSupabaseConfig() {
  const fileUrl = String(CONFIG.supabase?.url || "").trim();
  const fileKey = String(CONFIG.supabase?.anonKey || "").trim();
  if (!looksLikePlaceholder(fileUrl) && !looksLikePlaceholder(fileKey)) {
    return { url: fileUrl, anonKey: fileKey, source: "file" };
  }
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const url = String(parsed?.url || "").trim();
    const anonKey = String(parsed?.anonKey || "").trim();
    if (!looksLikePlaceholder(url) && !looksLikePlaceholder(anonKey)) {
      return { url, anonKey, source: "local" };
    }
  } catch {
    /* ignore corrupt override */
  }
  return null;
}

export function saveSupabaseConfig({ url, anonKey }) {
  const next = {
    url: String(url || "").trim(),
    anonKey: String(anonKey || "").trim(),
  };
  if (looksLikePlaceholder(next.url) || looksLikePlaceholder(next.anonKey)) {
    throw new Error("CONFIG_MISSING");
  }
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
  return next;
}
