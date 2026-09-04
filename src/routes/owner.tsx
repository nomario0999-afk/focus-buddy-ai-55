import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readStore, loadHistory, type Profile } from "@/lib/profiles";
import { loadRequests, type PayRequest } from "@/lib/billing";

/** Private owner code. Only the owner knows it — change it any time. */
const OWNER_CODE = "NOMAN-OWNER";
const UNLOCK_KEY = "focuser.owner.unlocked";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Board · Focuser" },
      { name: "description", content: "Private owner board for Focuser: see who uses the app on this device." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Owner Board · Focuser" },
      { property: "og:description", content: "Private owner board for Focuser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerBoard,
});

type Row = Profile & { sessions: number; minutes: number; avgFocus: number; lastSeen: number };

function OwnerBoard() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [requests, setRequests] = useState<PayRequest[]>([]);

  useEffect(() => {
    try { if (localStorage.getItem(UNLOCK_KEY) === "1") setUnlocked(true); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const load = () => {
      const store = readStore();
      setRows(
        store.profiles
          .map((p) => {
            const h = loadHistory(p.id);
            const minutes = h.reduce((n, e) => n + e.minutes, 0);
            const avg = h.length ? Math.round(h.reduce((n, e) => n + e.focusScore, 0) / h.length) : 0;
            return { ...p, sessions: h.length, minutes, avgFocus: avg, lastSeen: h[0]?.at ?? p.createdAt };
          })
          .sort((a, b) => b.minutes - a.minutes || b.bestStreak - a.bestStreak),
      );
      setRequests(loadRequests());
    };
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [unlocked]);

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-3xl font-black tracking-tight">🔐 Owner board</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Private area. Only the owner can open this page — nobody using the app can see it.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim().toUpperCase() === OWNER_CODE) {
              try { localStorage.setItem(UNLOCK_KEY, "1"); } catch { /* ignore */ }
              setUnlocked(true);
            } else setError("Wrong owner code.");
          }}
          className="mt-6 flex gap-2"
        >
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Owner code"
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          />
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Open</button>
        </form>
        {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">👑 Owner board</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone using Focuser on this device, ranked by focus minutes. Users never see this page.
          </p>
        </div>
        <button
          onClick={() => { try { localStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ } setUnlocked(false); }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          Lock again
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">#</th><th className="p-3">User</th><th className="p-3">Age / Country</th>
              <th className="p-3">Sessions</th><th className="p-3">Minutes</th><th className="p-3">Avg focus</th>
              <th className="p-3">Streak</th><th className="p-3">Focolara</th><th className="p-3">Plan</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="p-4 text-muted-foreground" colSpan={9}>No accounts on this device yet.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-bold">{i + 1}</td>
                <td className="p-3 font-semibold">{r.avatar} {r.name} {r.passwordHash ? "🔒" : ""}</td>
                <td className="p-3 text-muted-foreground">{r.age} · {r.country}</td>
                <td className="p-3">{r.sessions}</td>
                <td className="p-3">{r.minutes}</td>
                <td className="p-3">{r.avgFocus}%</td>
                <td className="p-3">🔥 {r.streak} (best {r.bestStreak})</td>
                <td className="p-3">🪙 {r.credits.toLocaleString()}</td>
                <td className="p-3">{r.subscribed ? "Pro" : "Free"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-xl font-bold tracking-tight">💬 Subscription requests</h2>
      <div className="mt-3 space-y-2">
        {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="font-semibold">{r.name} · {r.contact} · {r.plan === "teacher" ? "Teacher 100 SAR" : "Pro $15"}</div>
            <div className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString()}</div>
            {r.message && <p className="mt-1">{r.message}</p>}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        This board reads only what is stored in this browser. Passwords are hashed and cannot be shown.
      </p>
    </main>
  );
}
