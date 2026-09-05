import { useEffect, useState } from "react";
import {
  AVATARS, verifyPassword, MONTHLY_FREE_CREDITS, MONTHLY_PRO_CREDITS, SUBSCRIPTION_PRICE,
  type Profile, type ThemeKey,
} from "@/lib/profiles";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const THEMES: { key: ThemeKey; label: string; hint: string }[] = [
  { key: "auto", label: "Automatic", hint: "Picked from your age" },
  { key: "kids", label: "Kids", hint: "Big, bright and playful" },
  { key: "teen", label: "Teen", hint: "Bold and colourful" },
  { key: "adult", label: "Adult", hint: "Clean and calm" },
  { key: "elder", label: "Comfort", hint: "Larger text, high contrast" },
];

export type FormState = {
  name: string; age: string; country: string;
  day: string; month: string; year: string; avatar: string;
  role: "student" | "teacher";
  password?: string;
};

const blank: FormState = { name: "", age: "", country: "", day: "", month: "", year: "", avatar: AVATARS[0], role: "student", password: "" };

function ProfileForm({
  initial, submitLabel, onSubmit, onCancel, askPassword,
}: {
  initial?: Partial<FormState>;
  submitLabel: string;
  onSubmit: (v: FormState) => void;
  onCancel?: () => void;
  askPassword?: boolean;
}) {
  const [v, setV] = useState<FormState>({ ...blank, ...initial });
  const [confirm2, setConfirm2] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setV({ ...blank, ...initial }); }, [initial]);

  const set = <K extends keyof FormState>(k: K, val: FormState[K]) => setV((s) => ({ ...s, [k]: val }));

  const submit = () => {
    if (!v.name.trim()) return setError("Please write your name.");
    if (!v.age.trim() || Number(v.age) < 3 || Number(v.age) > 120) return setError("Please add a valid age (3–120).");
    if (!v.country.trim()) return setError("Please add your country.");
    if (!v.day || !v.month || !v.year) return setError("Please add your birthday: day, month and year.");
    if (askPassword) {
      const pw = v.password ?? "";
      if (pw.length < 6) return setError("Please choose a password with at least 6 characters.");
      if (pw !== confirm2) return setError("The two passwords do not match.");
    }
    setError(null);
    onSubmit({ ...v, name: v.name.trim().slice(0, 60), country: v.country.trim().slice(0, 60) });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => set("avatar", a)}
            aria-label={`Choose avatar ${a}`}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition ${
              v.avatar === a ? "ring-2 ring-primary scale-105" : "opacity-70 hover:opacity-100"
            }`}
            style={{ background: "var(--gradient-playful)" }}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="text-sm font-semibold">
        Your name
        <input value={v.name} onChange={(e) => set("name", e.target.value.slice(0, 60))} placeholder="e.g. Ammar"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary" />
      </label>
      <label className="text-sm font-semibold">
        Age
        <input type="number" min={3} max={120} value={v.age} onChange={(e) => set("age", e.target.value.slice(0, 3))} placeholder="e.g. 12"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary" />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        Country
        <input value={v.country} onChange={(e) => set("country", e.target.value.slice(0, 60))} placeholder="e.g. Pakistan"
          className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary" />
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold">Birthday 🎂</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <select value={v.day} onChange={(e) => set("day", e.target.value)} className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary">
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={v.month} onChange={(e) => set("month", e.target.value)} className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary">
            <option value="">Month</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={v.year} onChange={(e) => set("year", e.target.value)} className="rounded-2xl border border-border bg-background px-3 py-3 text-base outline-none focus:border-primary">
            <option value="">Year</option>
            {Array.from({ length: 110 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </fieldset>

      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold">I am a…</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {([
            { key: "student", label: "🎒 Student", hint: "Timer, tutor, games and streaks" },
            { key: "teacher", label: "🍎 Teacher", hint: "Class dashboard and exam mode" },
          ] as const).map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => set("role", r.key)}
              className={`rounded-2xl border p-3 text-left transition ${
                v.role === r.key ? "border-primary bg-accent" : "border-border hover:bg-muted"
              }`}
            >
              <div className="text-sm font-bold">{r.label}</div>
              <div className="text-xs font-normal text-muted-foreground">{r.hint}</div>
            </button>
          ))}
        </div>
      </fieldset>

      {askPassword && (
        <>
          <label className="text-sm font-semibold">
            Password 🔒
            <input type="password" autoComplete="new-password" value={v.password ?? ""} onChange={(e) => set("password", e.target.value.slice(0, 64))} placeholder="At least 6 characters"
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary" />
          </label>
          <label className="text-sm font-semibold">
            Confirm password
            <input type="password" autoComplete="new-password" value={confirm2} onChange={(e) => setConfirm2(e.target.value.slice(0, 64))} placeholder="Type it again"
              className="mt-1 w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-normal outline-none focus:border-primary" />
          </label>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            🔐 Your password is scrambled (hashed) and stored only on this device. It is never sent anywhere and cannot be read back.
          </p>
        </>
      )}

      {error && <p className="text-sm font-medium text-destructive sm:col-span-2">{error}</p>}

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button type="submit" className="rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90" style={{ background: "var(--gradient-fun)" }}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function ProfileHub({
  profiles, active, onSwitch, onCreate, onUpdate, onDelete,
}: {
  profiles: Profile[];
  active: Profile | null;
  onSwitch: (id: string) => void;
  onCreate: (v: FormState) => void;
  onUpdate: (id: string, patch: Partial<Profile>) => void;
  onDelete: (id: string) => void;
}) {
  const [view, setView] = useState<"none" | "create" | "edit" | "settings">("none");
  const [loginFor, setLoginFor] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const tryLogin = async () => {
    const target = profiles.find((p) => p.id === loginFor);
    if (!target) return;
    if (await verifyPassword(target, pw)) { setLoginFor(null); setPw(""); onSwitch(target.id); }
    else setPwError("Wrong password. Try again.");
  };
  useEffect(() => { if (!active) setView("none"); }, [active]);

  const ageNum = Number(active?.age ?? 0);
  const greeting = ageNum >= 55 ? "Welcome back" : ageNum >= 18 ? "Hey" : "Hi there";

  const shell = (children: React.ReactNode) => (
    <div className="rounded-3xl p-[2px] shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-fun)" }}>
      <div className="card-fun rounded-3xl p-6 md:p-8">{children}</div>
    </div>
  );

  if (!active || view === "create") {
    return shell(
      <>
        <h2 className="text-2xl font-black tracking-tight">
          {profiles.length ? "Add another person 👥" : "Create your free account 🎉"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No email needed — just your name and a private password kept on this device. Perfect for kids, students, grown-ups and grandparents.
        </p>
        <ProfileForm
          askPassword
          submitLabel={profiles.length ? "Add profile 🚀" : "Create my account 🚀"}
          onSubmit={(v) => { onCreate(v); setView("none"); }}
          onCancel={profiles.length ? () => setView("none") : undefined}
        />
      </>,
    );
  }

  if (view === "edit") {
    return shell(
      <>
        <h2 className="text-2xl font-black tracking-tight">Edit your account ✏️</h2>
        <ProfileForm
          initial={active}
          submitLabel="Save changes"
          onSubmit={(v) => { onUpdate(active.id, v); setView("none"); }}
          onCancel={() => setView("none")}
        />
      </>,
    );
  }

  if (view === "settings") {
    return shell(
      <>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight">⚙️ Profile settings</h2>
          <button onClick={() => setView("none")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Done</button>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Theme</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <button key={t.key} onClick={() => onUpdate(active.id, { theme: t.key })}
                className={`rounded-2xl border p-3 text-left transition ${active.theme === t.key ? "border-primary bg-accent" : "border-border hover:bg-muted"}`}>
                <div className="text-sm font-bold">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Privacy &amp; consent</h3>
          <div className="mt-2 space-y-2">
            {([
              ["camera", "Camera focus checks", "Foco may use the webcam during focus sessions. Frames are analysed and never stored."],
              ["ai", "AI tutor & summaries", "Your questions and session stats are sent to the AI to generate answers and recaps."],
              ["storage", "Save my data on this device", "Profiles, streaks, credits and history stay in this browser only."],
            ] as const).map(([k, label, hint]) => (
              <label key={k} className="flex items-start gap-3 rounded-2xl border border-border p-3">
                <input type="checkbox" className="mt-1"
                  checked={Boolean(active.consent?.[k])}
                  onChange={(e) => onUpdate(active.id, {
                    consent: {
                      camera: active.consent?.camera ?? false,
                      ai: active.consent?.ai ?? false,
                      storage: active.consent?.storage ?? false,
                      acceptedAt: Date.now(),
                      [k]: e.target.checked,
                    },
                  })} />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => setView("edit")} className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold hover:bg-accent">Edit details</button>
          <button
            onClick={() => { if (confirm(`Delete ${active.name}'s profile and history?`)) onDelete(active.id); }}
            className="rounded-full border border-destructive/40 px-5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
            Delete profile
          </button>
        </div>
      </>,
    );
  }

  return (
    <div className="rounded-3xl p-[2px] shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-fun)" }}>
      <div className="card-fun rounded-3xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: "var(--gradient-playful)" }} aria-hidden="true">
            {active.avatar}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{greeting} 👋</p>
            <h2 className="truncate text-2xl font-black tracking-tight">{active.name}</h2>
            <p className="text-sm text-muted-foreground">
              {active.age} years old · {active.country} · 🎂 {active.day} {active.month} {active.year}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
              🪙 {active.credits.toLocaleString()} credits
            </span>
            <button onClick={() => setView("settings")} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent">⚙️ Settings</button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Switch user</span>
          {profiles.map((p) => (
            <button key={p.id} onClick={() => { if (p.id !== active.id && p.passwordHash) { setLoginFor(p.id); setPw(""); setPwError(null); } else onSwitch(p.id); }}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                p.id === active.id ? "border-primary bg-accent" : "border-border hover:bg-muted"
              }`}>
              <span>{p.avatar}</span>{p.name.split(" ")[0]}{p.passwordHash ? " 🔒" : ""}
            </button>
          ))}
          <button onClick={() => setView("create")} className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
            + Add person
          </button>
        </div>

        {loginFor && (
          <form onSubmit={(e) => { e.preventDefault(); void tryLogin(); }} className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-bold">🔒 Enter the password for {profiles.find((p) => p.id === loginFor)?.name}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password"
                className="flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-base outline-none focus:border-primary" />
              <button type="submit" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">Unlock</button>
              <button type="button" onClick={() => { setLoginFor(null); setPwError(null); }} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Cancel</button>
            </div>
            {pwError && <p className="mt-2 text-sm font-medium text-destructive">{pwError}</p>}
          </form>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Free plan: {MONTHLY_FREE_CREDITS} credits every month. Pro ({SUBSCRIPTION_PRICE}/month): {MONTHLY_PRO_CREDITS.toLocaleString()} credits.
        </p>
      </div>
    </div>
  );
}
