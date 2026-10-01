import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ownerOverview, type ActivityRow } from "@/lib/owner-sync.functions";
import { fmtAmount } from "@/lib/owners";

const CODE_KEY = "focuser.owner.code";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Board · Focuser" },
      { name: "description", content: "Private owner board for Focuser: everyone using the app, classes, reports and Pro activations." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Owner Board · Focuser" },
      { property: "og:description", content: "Private owner board for Focuser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerBoard,
});

type Tab = "people" | "classes" | "reports" | "pro" | "requests";

const fmtMs = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

function OwnerBoard() {
  const fetchOverview = useServerFn(ownerOverview);
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("people");

  const load = useCallback(
    async (c: string) => {
      try {
        const r = await fetchOverview({ data: { code: c } });
        if (!r.ok) {
          setError("Wrong owner code.");
          setSaved(null);
          localStorage.removeItem(CODE_KEY);
          return;
        }
        setError("");
        setSaved(c);
        localStorage.setItem(CODE_KEY, c);
        setRows(r.rows);
      } catch {
        setError("Could not load right now. Try again.");
      }
    },
    [fetchOverview],
  );

  useEffect(() => {
    const c = localStorage.getItem(CODE_KEY);
    if (c) void load(c);
  }, [load]);

  useEffect(() => {
    if (!saved) return;
    const t = setInterval(() => void load(saved), 10000);
    return () => clearInterval(t);
  }, [saved, load]);

  const by = useMemo(() => {
    const g: Record<string, ActivityRow[]> = { person: [], class: [], pro: [], request: [] };
    for (const r of rows) (g[r.kind] ??= []).push(r);
    return g;
  }, [rows]);

  if (!saved) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-3xl font-black tracking-tight">🔐 Owner board</h1>
        <p className="mt-2 text-sm text-muted-foreground">Private area. Only the owner code opens it.</p>
        <form onSubmit={(e) => { e.preventDefault(); void load(code); }} className="mt-6 flex gap-2">
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Owner code"
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary" />
          <button className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">Open</button>
        </form>
        {error && <p className="mt-2 text-sm font-medium text-destructive">{error}</p>}
      </main>
    );
  }

  const people = by.person ?? [];
  const classes = by.class ?? [];
  const reports = classes.flatMap((c) =>
    ((c.data.students as Array<Record<string, unknown>>) ?? []).map((s) => ({ cls: c, s })),
  );
  const teachers = people.filter((p) => p.data.role === "teacher").length;
  const pros = people.filter((p) => p.data.subscribed).length;
  const weekAgo = Date.now() - 7 * 864e5;
  const activeWeek = people.filter((p) => new Date(p.updated_at).getTime() > weekAgo).length;

  const tabs: [Tab, string, number][] = [
    ["people", "👥 People", people.length],
    ["classes", "🏫 Teacher classes", classes.length],
    ["reports", "📋 Student reports", reports.length],
    ["pro", "⭐ Pro activations", (by.pro ?? []).length],
    ["requests", "💬 Requests", (by.request ?? []).length],
  ];

  const cell = "p-3";
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">👑 Owner board</h1>
          <p className="mt-1 text-sm text-muted-foreground">Everyone using Focuser on any phone or computer. Updates every 10 seconds.</p>
        </div>
        <button onClick={() => { localStorage.removeItem(CODE_KEY); setSaved(null); }}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">Lock again</button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[["People in Focuser", people.length], ["Active this week", activeWeek], ["Teachers", teachers], ["Pro users", pros], ["Classes", classes.length]].map(([l, n]) => (
          <div key={l as string} className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="text-3xl font-black">{n}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
            {l} ({n})
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          {tab === "people" && (<>
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className={cell}>Name</th><th className={cell}>Type</th><th className={cell}>Age / Country</th><th className={cell}>Plan</th><th className={cell}>Streak</th><th className={cell}>Focolara</th><th className={cell}>Last seen</th></tr></thead>
            <tbody>{people.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className={`${cell} font-semibold`}>{p.name || "—"}</td>
                <td className={cell}>{p.data.role === "teacher" ? "Teacher" : "Student"}</td>
                <td className={`${cell} text-muted-foreground`}>{String(p.data.age ?? "")} · {String(p.data.country ?? "")}</td>
                <td className={cell}>{p.data.subscribed ? "Pro" : "Free"}</td>
                <td className={cell}>🔥 {fmtAmount(Number(p.data.streak ?? 0))}</td>
                <td className={cell}>🪙 {fmtAmount(Number(p.data.credits ?? 0))}</td>
                <td className={`${cell} text-muted-foreground`}>{new Date(p.updated_at).toLocaleString()}</td>
              </tr>))}</tbody>
          </>)}
          {tab === "classes" && (<>
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className={cell}>Class</th><th className={cell}>Code</th><th className={cell}>Teacher</th><th className={cell}>Students</th><th className={cell}>Status</th><th className={cell}>Created</th></tr></thead>
            <tbody>{classes.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className={`${cell} font-semibold`}>{c.name}</td>
                <td className={`${cell} font-mono`}>{c.ref}</td>
                <td className={cell}>{String(c.data.teacher ?? "")}</td>
                <td className={cell}>{((c.data.students as unknown[]) ?? []).length}</td>
                <td className={cell}>{c.data.active ? "🟢 Live" : "⏸ Stopped"}</td>
                <td className={`${cell} text-muted-foreground`}>{new Date(Number(c.data.createdAt) || c.created_at).toLocaleString()}</td>
              </tr>))}</tbody>
          </>)}
          {tab === "reports" && (<>
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className={cell}>Student</th><th className={cell}>Class</th><th className={cell}>Teacher</th><th className={cell}>Look-away flags</th><th className={cell}>Total away</th><th className={cell}>Status</th></tr></thead>
            <tbody>{reports.map(({ cls, s }, i) => (
              <tr key={i} className="border-t border-border">
                <td className={`${cell} font-semibold`}>{String(s.name)}</td>
                <td className={cell}>{cls.name} ({cls.ref})</td>
                <td className={cell}>{String(cls.data.teacher ?? "")}</td>
                <td className={cell}>{Number(s.flags) > 0 ? `🚩 ${s.flags}` : "✅ 0"}</td>
                <td className={cell}>{fmtMs(Number(s.awayMs) || 0)}</td>
                <td className={cell}>{String(s.status)}</td>
              </tr>))}</tbody>
          </>)}
          {tab === "pro" && (<>
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className={cell}>Name</th><th className={cell}>Plan</th><th className={cell}>Contact</th><th className={cell}>Activated</th></tr></thead>
            <tbody>{(by.pro ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className={`${cell} font-semibold`}>{r.name}</td>
                <td className={cell}>{r.data.plan === "teacher" ? "Teacher 100 SAR" : "Pro $15"}</td>
                <td className={cell}>{String(r.data.contact ?? "")}</td>
                <td className={`${cell} text-muted-foreground`}>{new Date(r.created_at).toLocaleString()}</td>
              </tr>))}</tbody>
          </>)}
          {tab === "requests" && (<>
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className={cell}>Name</th><th className={cell}>Plan</th><th className={cell}>Contact</th><th className={cell}>Message</th><th className={cell}>When</th></tr></thead>
            <tbody>{(by.request ?? []).map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className={`${cell} font-semibold`}>{r.name}</td>
                <td className={cell}>{r.data.plan === "teacher" ? "Teacher 100 SAR" : "Pro $15"}</td>
                <td className={cell}>{String(r.data.contact ?? "")}</td>
                <td className={cell}>{String(r.data.message ?? "")}</td>
                <td className={`${cell} text-muted-foreground`}>{new Date(r.created_at).toLocaleString()}</td>
              </tr>))}</tbody>
          </>)}
        </table>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Passwords are never sent here. People who have not opened Focuser since this update will appear the next time they use it.</p>
    </main>
  );
}
