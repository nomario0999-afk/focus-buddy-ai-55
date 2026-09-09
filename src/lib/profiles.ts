import { useCallback, useEffect, useState } from "react";
import { isOwnerName, UNLIMITED } from "@/lib/owners";

export type ThemeKey = "auto" | "kids" | "teen" | "adult" | "elder";

export type Consent = {
  camera: boolean;
  ai: boolean;
  storage: boolean;
  acceptedAt: number;
};

export type Profile = {
  id: string;
  name: string;
  age: string;
  country: string;
  day: string;
  month: string;
  year: string;
  avatar: string;
  createdAt: number;
  credits: number;
  creditsPeriod: string; // YYYY-MM of last monthly grant
  subscribed: boolean;
  streak: number;
  bestStreak: number;
  theme: ThemeKey;
  /** Students study; teachers get the classroom / exam dashboard. */
  role: "student" | "teacher";
  consent: Consent | null;
  /** Salted SHA-256 hash of the account password (never the password itself). */
  passwordHash?: string;
};

export type HistoryEntry = {
  id: string;
  at: number;
  minutes: number;
  subject: string;
  grade: string;
  summary: string;
  focusScore: number;
  tip: string;
  distractions: number;
  /** Optional private webcam snapshots recorded during the session (this device only). */
  frames?: string[];
};

const STORE_KEY = "focuser.users";
const LEGACY_KEY = "focuser.profile";

export const CURRENCY = "Focolara";
export const MONTHLY_FREE_CREDITS = 100;
export const MONTHLY_PRO_CREDITS = 500000;
export const STREAK_BONUS_CREDITS = 70;
/** Awarded once per game won — never per question. */
export const GAME_WIN_CREDITS = 10;
export const SUBSCRIPTION_PRICE = "$15";

export const AVATARS = ["🦊", "🐨", "🐼", "🦉", "🐯", "🦄", "🐙", "🌟", "🐵", "🐸", "🦁", "🐧"];

type Store = { profiles: Profile[]; activeId: string | null };

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function themeForAge(age: number): Exclude<ThemeKey, "auto"> {
  if (age < 13) return "kids";
  if (age < 20) return "teen";
  if (age < 55) return "adult";
  return "elder";
}

export function resolvedTheme(p: Profile | null): Exclude<ThemeKey, "auto"> {
  if (!p) return "adult";
  if (p.theme && p.theme !== "auto") return p.theme;
  return themeForAge(Number(p.age) || 20);
}

function emptyStore(): Store {
  return { profiles: [], activeId: null };
}

export function readStore(): Store {
  if (typeof localStorage === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      if (Array.isArray(parsed.profiles)) return parsed;
    }
    // migrate legacy single profile
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const l = JSON.parse(legacy) as Partial<Profile>;
      const migrated = normalize({ ...l, id: "legacy" } as Profile);
      const store: Store = { profiles: [migrated], activeId: migrated.id };
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
      return store;
    }
  } catch { /* ignore */ }
  return emptyStore();
}

export function writeStore(store: Store) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

export function normalize(p: Profile): Profile {
  const owner = isOwnerName(p.name);
  return {
    id: p.id || `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: p.name ?? "",
    age: p.age ?? "",
    country: p.country ?? "",
    day: p.day ?? "",
    month: p.month ?? "",
    year: p.year ?? "",
    avatar: p.avatar || AVATARS[0],
    createdAt: p.createdAt ?? Date.now(),
    credits: owner ? UNLIMITED : typeof p.credits === "number" ? p.credits : MONTHLY_FREE_CREDITS,
    creditsPeriod: p.creditsPeriod || currentPeriod(),
    subscribed: owner ? true : Boolean(p.subscribed),
    streak: owner ? UNLIMITED : p.streak ?? 0,
    bestStreak: owner ? UNLIMITED : p.bestStreak ?? p.streak ?? 0,
    theme: p.theme ?? "auto",
    role: p.role === "teacher" ? "teacher" : "student",
    consent: p.consent ?? null,
    passwordHash: p.passwordHash,
  };
}


/** Grant the monthly allowance if we've rolled into a new month. */
function withMonthlyGrant(p: Profile): Profile {
  const period = currentPeriod();
  if (p.creditsPeriod === period) return p;
  const grant = p.subscribed ? MONTHLY_PRO_CREDITS : MONTHLY_FREE_CREDITS;
  return { ...p, credits: Math.max(p.credits, 0) + grant, creditsPeriod: period };
}

export function historyKey(id: string) { return `focuser.history.${id}`; }

export function loadHistory(id: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(historyKey(id));
    const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function saveHistoryList(id: string, list: HistoryEntry[]) {
  try { localStorage.setItem(historyKey(id), JSON.stringify(list.slice(0, 50))); } catch { /* ignore */ }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const store = readStore();
    const granted = store.profiles.map((p) => withMonthlyGrant(normalize(p)));
    setProfiles(granted);
    setActiveId(store.activeId && granted.some((p) => p.id === store.activeId) ? store.activeId : granted[0]?.id ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStore({ profiles, activeId });
  }, [profiles, activeId, ready]);

  const active = profiles.find((p) => p.id === activeId) ?? null;

  const updateProfile = useCallback((id: string, patch: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? normalize({ ...p, ...patch }) : p)));
  }, []);

  const patchActive = useCallback((patch: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === activeId ? normalize({ ...p, ...patch }) : p)));
  }, [activeId]);

  const addProfile = useCallback((p: Omit<Profile, "id" | "createdAt" | "credits" | "creditsPeriod" | "subscribed" | "streak" | "bestStreak" | "consent"> & Partial<Profile>) => {
    const created = normalize({ ...(p as Profile), id: "", createdAt: Date.now() });
    setProfiles((prev) => [...prev, created]);
    setActiveId(created.id);
    return created;
  }, []);

  const removeProfile = useCallback((id: string) => {
    try { localStorage.removeItem(historyKey(id)); } catch { /* ignore */ }
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActiveId((cur) => (cur === id ? next[0]?.id ?? null : cur));
      return next;
    });
  }, []);

  return { profiles, active, activeId, ready, setActiveId, addProfile, updateProfile, patchActive, removeProfile };
}

/* ── Passwords ──────────────────────────────────────────────────────────
   Passwords never leave this device. We store only a salted SHA-256 hash,
   so nobody (not even us) can read the password back out of storage. */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`focuser:${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(p: Profile, password: string): Promise<boolean> {
  if (!p.passwordHash) return true;
  const h = await hashPassword(password, p.id);
  return h === p.passwordHash;
}
