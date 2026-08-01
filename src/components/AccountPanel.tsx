import { useEffect, useState } from "react";

export type Profile = {
  name: string;
  age: string;
  country: string;
  day: string;
  month: string;
  year: string;
  avatar: string;
  createdAt: number;
};

const STORAGE_KEY = "focuser.profile";
const AVATARS = ["🦊", "🐨", "🐼", "🦉", "🐯", "🦄", "🐙", "🌟"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export default function AccountPanel({
  profile,
  onChange,
}: {
  profile: Profile | null;
  onChange: (p: Profile | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setAge(profile.age);
    setCountry(profile.country);
    setDay(profile.day);
    setMonth(profile.month);
    setYear(profile.year);
    setAvatar(profile.avatar || AVATARS[0]);
  }, [profile]);

  const save = () => {
    if (!name.trim()) { setError("Please write your name."); return; }
    if (!age.trim() || Number(age) < 3 || Number(age) > 120) { setError("Please add a valid age (3–120)."); return; }
    if (!country.trim()) { setError("Please add your country."); return; }
    if (!day || !month || !year) { setError("Please add your birthday: day, month and year."); return; }
    setError(null);
    const next: Profile = {
      name: name.trim().slice(0, 60),
      age: age.trim(),
      country: country.trim().slice(0, 60),
      day, month, year,
      avatar,
      createdAt: profile?.createdAt ?? Date.now(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    onChange(next);
    setEditing(false);
  };

  const signOut = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    onChange(null);
    setEditing(false);
    setName(""); setAge(""); setCountry(""); setDay(""); setMonth(""); setYear("");
  };

  const ageNum = Number(profile?.age ?? 0);
  const greeting = ageNum >= 55 ? "Welcome back" : ageNum >= 18 ? "Hey" : "Hi there";

  if (profile && !editing) {
    return (
      <div className="rounded-3xl p-[2px] shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-fun)" }}>
        <div className="card-fun flex flex-wrap items-center gap-4 rounded-3xl p-6">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: "var(--gradient-playful)" }}
            aria-hidden="true"
          >
            {profile.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h2 className="truncate text-2xl font-black tracking-tight">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">
              {profile.age} years old · {profile.country} · 🎂 {profile.day} {profile.month} {profile.year}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              Edit profile
            </button>
            <button
              onClick={signOut}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-[2px] shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-fun)" }}>
      <div className="card-fun rounded-3xl p-6 md:p-8">
        <h2 className="text-2xl font-black tracking-tight">
          {profile ? "Edit your account ✏️" : "Create your free account 🎉"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No email, no password — just tell Foco a little about you. Perfect for kids, students, grown-ups and grandparents.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAvatar(a)}
              aria-label={`Choose avatar ${a}`}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
                avatar === a ? "ring-2 ring-primary scale-105" : "opacity-70 hover:opacity-100"
              }`}
              style={{ background: "var(--gradient-playful)" }}
            >
              {a}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="text-sm font-semibold">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="e.g. Ammar"
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm font-semibold">
            Age
            <input
              type="number"
              min={3}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value.slice(0, 3))}
              placeholder="e.g. 12"
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary"
            />
          </label>
          <label className="text-sm font-semibold sm:col-span-2">
            Country
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value.slice(0, 60))}
              placeholder="e.g. Pakistan"
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary"
            />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-semibold">Birthday 🎂</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary"
              >
                <option value="">Month</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary"
              >
                <option value="">Year</option>
                {Array.from({ length: 110 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </fieldset>

          {error && <p className="text-sm font-medium text-destructive sm:col-span-2">{error}</p>}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
              style={{ background: "var(--gradient-fun)" }}
            >
              {profile ? "Save changes" : "Create my account 🚀"}
            </button>
            {profile && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
