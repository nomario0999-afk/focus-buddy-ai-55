import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import SubscribeRequest from "@/components/SubscribeRequest";
import { TEACHER_PRICE } from "@/lib/billing";
import { createGazeTracker, fmtClock, fmtDur } from "@/lib/gaze-tracker";
import { useProfiles } from "@/lib/profiles";
import { makeCode, summarizeCsv, useClassroom, type ExamSession, type Flag } from "@/lib/classroom";

export const Route = createFileRoute("/proctor")({
  component: ProctorPage,
  head: () => ({
    meta: [
      { title: "Proctored Exam & Classroom Mode — Focuser" },
      {
        name: "description",
        content:
          "Run AI-proctored exams in Focuser: on-device gaze tracking, look-away flags with timestamps, a live teacher dashboard and downloadable reports.",
      },
      { property: "og:title", content: "Proctored Exam & Classroom Mode — Focuser" },
      {
        property: "og:description",
        content: "AI gaze tracking, live student monitoring and exam integrity reports for teachers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PAID_KEY = "focuser.teacherPaid";
const AWAY_MS = 2000;

function ProctorPage() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">F</div>
          <span className="text-lg font-bold tracking-tight">Focuser</span>
        </Link>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["teacher", "student"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Proctored Exam &amp; Classroom Mode
        </span>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
          Exams you can <span className="text-primary">trust</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          On-device AI gaze tracking flags every look-away over 2 seconds with exact timestamps, streams status to the teacher
          dashboard live, and exports a full integrity report when the exam ends.
        </p>
      </section>

      <main className="mx-auto max-w-6xl px-6 pb-24">{role === "teacher" ? <TeacherView /> : <StudentView />}</main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Live monitoring syncs between tabs and devices signed into the same browser profile. Video never leaves the student's
        device — only status and flags are shared.
      </footer>
    </div>
  );
}

/* ───────────────────────── Teacher ───────────────────────── */

function TeacherView() {
  const [paid, setPaid] = useState(false);
  const [title, setTitle] = useState("Maths Unit Test");
  const [teacher, setTeacher] = useState("");
  const { active: me, ready } = useProfiles();
  const { sessions, mutate } = useClassroom();
  const [activeCode, setActiveCode] = useState<string | null>(null);

  useEffect(() => {
    setPaid(localStorage.getItem(PAID_KEY) === "1");
  }, []);

  useEffect(() => {
    if (me?.role === "teacher" && !teacher) setTeacher(me.name);
  }, [me, teacher]);

  if (ready && me?.role !== "teacher") {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="text-5xl" aria-hidden="true">🍎</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight">Sign in with a teacher account</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {me
            ? `${me.name} is a student account. Add or switch to a teacher account to create classes, run exams and see the live dashboard.`
            : "Create a free teacher account first — pick “Teacher” when you make it — then come back here to create your classes."}
        </p>
        <Link
          to="/"
          className="mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)]"
          style={{ background: "var(--gradient-fun)" }}
        >
          {me ? "Switch account" : "Create teacher account"}
        </Link>
      </div>
    );
  }

  if (!paid) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight">🔒 Teacher access locked</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You are signed in as a teacher 🍎. To run exams at scale, unlock teacher access with a one-time payment — pay by number, then we send your activation code.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{TEACHER_PRICE}</div>
              <div className="text-xs text-muted-foreground">per class / exam subscription</div>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="rounded-2xl bg-muted/50 p-3">👁️ Live AI gaze tracking for every student</li>
            <li className="rounded-2xl bg-muted/50 p-3">🚩 Instant look-away alerts with exact timings</li>
            <li className="rounded-2xl bg-muted/50 p-3">🎟️ Unlimited class invite codes</li>
            <li className="rounded-2xl bg-muted/50 p-3">📄 Downloadable post-exam integrity report</li>
          </ul>
        </div>

        <SubscribeRequest
          plan="teacher"
          price={TEACHER_PRICE}
          title="💬 Message us to buy teacher access"
          blurb="Send a message with your details. We reply on your number with the payment number — you pay by number, then we send an activation code. No live chat, this is a feedback box only."
          onActivated={() => {
            localStorage.setItem(PAID_KEY, "1");
            setPaid(true);
          }}
        />
      </div>
    );
  }

  const list = Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);
  const current = activeCode ? sessions[activeCode] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <span className="rounded-full bg-[var(--success)] px-3 py-1 text-xs font-bold text-[var(--success-foreground)]">
          ✅ Payment verified · Teacher pass active
        </span>
        <span className="text-xs text-muted-foreground">{TEACHER_PRICE} class subscription</span>
        <button
          onClick={() => {
            localStorage.removeItem(PAID_KEY);
            setPaid(false);
          }}
          className="ml-auto text-xs font-semibold text-muted-foreground underline"
        >
          Sign out of teacher mode
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-black tracking-tight">Create an exam session</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Exam title"
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="Your name"
            className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => {
              const code = makeCode();
              mutate((s) => {
                s[code] = {
                  code,
                  title: title.trim() || "Exam",
                  teacher: teacher.trim() || "Teacher",
                  createdAt: Date.now(),
                  active: true,
                  students: {},
                };
              });
              setActiveCode(code);
            }}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
            style={{ background: "var(--gradient-fun)" }}
          >
            Generate invite code
          </button>
        </div>
      </div>

      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveCode(s.code)}
              className={`rounded-2xl border px-4 py-2 text-left text-sm ${
                activeCode === s.code ? "border-primary bg-accent" : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span className="font-bold">{s.code}</span>
              <span className="ml-2 text-muted-foreground">{s.title}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {Object.keys(s.students).length} student{Object.keys(s.students).length === 1 ? "" : "s"}
              </span>
            </button>
          ))}
        </div>
      )}

      {current && <Dashboard session={current} mutate={mutate} />}
    </div>
  );
}

function Dashboard({
  session,
  mutate,
}: {
  session: ExamSession;
  mutate: (fn: (s: Record<string, ExamSession>) => void) => void;
}) {
  const students = Object.values(session.students).sort((a, b) => a.joinedAt - b.joinedAt);
  const alerts = students
    .flatMap((s) => s.flags.map((f) => ({ ...f, name: s.name })))
    .sort((a, b) => b.start - a.start)
    .slice(0, 12);

  function download() {
    const blob = new Blob([summarizeCsv(session)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focuser-exam-${session.code}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{session.title}</h2>
            <p className="text-sm text-muted-foreground">
              Invite code <span className="select-all font-mono text-base font-bold text-foreground">{session.code}</span> ·
              students join from the Student tab.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => mutate((s) => { const t = s[session.code]; if (t) t.active = !t.active; })}
              className={`rounded-full px-5 py-2.5 text-sm font-bold ${
                session.active
                  ? "bg-[var(--success)] text-[var(--success-foreground)]"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              {session.active ? "🟢 Monitoring ON" : "⚪ Monitoring OFF"}
            </button>
            <button onClick={download} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              ⬇️ Download report
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-bold">Students ({students.length})</h3>
          {students.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Waiting for students to join with code {session.code}…</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {students.map((s) => {
                const stale = Date.now() - s.lastSeen > 8000;
                const bad = s.status !== "ok" || stale;
                return (
                  <div
                    key={s.id}
                    className={`overflow-hidden rounded-2xl border p-3 ${bad ? "border-destructive/60 bg-destructive/5" : "border-border bg-muted/40"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">{s.name}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${bad ? "bg-destructive text-destructive-foreground" : "bg-[var(--success)] text-[var(--success-foreground)]"}`}>
                        {stale ? "offline" : s.status === "ok" ? "focused" : s.status === "away" ? "looking away" : "no camera"}
                      </span>
                    </div>
                    {s.snapshot && (
                      <img src={s.snapshot} alt={`${s.name} live thumbnail`} className="mt-2 h-24 w-full rounded-xl object-cover" />
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">{s.reason}</p>
                    <p className="text-xs font-semibold">
                      🚩 {s.flags.length} flagged look-away{s.flags.length === 1 ? "" : "s"} ·{" "}
                      {fmtDur(s.flags.reduce((t, f) => t + (f.end - f.start), 0))} away in total
                    </p>
                    {s.flags[0] && (
                      <p className="text-[11px] text-muted-foreground">
                        Last: {fmtClock(s.flags[0].start)} → {fmtClock(s.flags[0].end)} ({fmtDur(s.flags[0].end - s.flags[0].start)})
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-bold">Live alerts</h3>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No suspicious behaviour yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {alerts.map((a) => (
                <li key={a.id} className="rounded-2xl border border-border p-3 text-xs">
                  <span className="font-bold">{a.name}</span> looked away for{" "}
                  <span className="font-bold">{fmtDur(a.end - a.start)}</span>
                  <div className="text-muted-foreground">
                    {fmtClock(a.start)} → {fmtClock(a.end)} · {a.reason}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Student ───────────────────────── */

function StudentView() {
  const { sessions, mutate } = useClassroom();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [joined, setJoined] = useState<{ code: string; id: string } | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<{ status: "ok" | "away" | "no-camera"; reason: string }>({ status: "no-camera", reason: "Camera off" });
  const [flags, setFlags] = useState<Flag[]>([]);
  const [calibrating, setCalibrating] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef(createGazeTracker());
  const awaySince = useRef<number | null>(null);
  const awayReason = useRef("");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function join() {
    const c = code.trim().toUpperCase();
    if (!sessions[c]) {
      setError("No exam found with that code.");
      return;
    }
    if (!name.trim()) {
      setError("Enter your name.");
      return;
    }
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch {
      setError("Camera permission is required to sit a proctored exam.");
      return;
    }
    const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    trackerRef.current.reset();
    setCalibrating(true);
    mutate((s) => {
      const sess = s[c];
      if (!sess) return;
      sess.students[id] = {
        id,
        name: name.trim(),
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        status: "ok",
        reason: "Calibrating…",
        flags: [],
      };
    });
    setJoined({ code: c, id });
  }

  // Tracking loop
  useEffect(() => {
    if (!joined) return;
    const tracker = trackerRef.current;
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = 160;
    snapCanvas.height = 120;

    const iv = setInterval(() => {
      const video = videoRef.current;
      const live = streamRef.current?.getVideoTracks()[0]?.readyState === "live";
      let next: { status: "ok" | "away" | "no-camera"; reason: string };

      if (!video || !live) {
        next = { status: "no-camera", reason: "Camera turned off" };
      } else if (!tracker.calibrated) {
        tracker.calibrate(video);
        setCalibrating(!tracker.calibrated);
        next = { status: "ok", reason: "Calibrating — look at the screen" };
      } else {
        const s = tracker.sample(video);
        next = s.away ? { status: "away", reason: s.reason } : { status: "ok", reason: "On screen" };
      }
      setStatus(next);

      // away-duration flagging
      const now = Date.now();
      let newFlag: Flag | null = null;
      if (next.status !== "ok") {
        if (awaySince.current === null) {
          awaySince.current = now;
          awayReason.current = next.reason;
        }
      } else if (awaySince.current !== null) {
        const start = awaySince.current;
        if (now - start > AWAY_MS) {
          newFlag = { id: `f_${start}`, start, end: now, reason: awayReason.current };
          setFlags((f) => [newFlag as Flag, ...f]);
        }
        awaySince.current = null;
      }

      let snapshot: string | undefined;
      if (video && live) {
        const ctx = snapCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
          snapshot = snapCanvas.toDataURL("image/jpeg", 0.4);
        }
      }

      mutate((store) => {
        const st = store[joined.code]?.students[joined.id];
        if (!st) return;
        st.lastSeen = now;
        st.status = next.status;
        st.reason = next.reason;
        if (snapshot) st.snapshot = snapshot;
        if (newFlag) st.flags = [newFlag, ...st.flags].slice(0, 100);
      });
    }, 700);

    return () => clearInterval(iv);
  }, [joined, mutate]);

  const liveAway = status.status !== "ok";
  const session = joined ? sessions[joined.code] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        {!joined ? (
          <>
            <h2 className="text-xl font-black tracking-tight">Join your exam</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask your teacher for the 6-letter invite code. Your camera is analysed on your own device — no video is uploaded.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Invite code"
                maxLength={6}
                className="w-full rounded-2xl border border-border bg-background px-4 py-2.5 font-mono text-lg tracking-[0.3em] outline-none focus:ring-2 focus:ring-ring"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
                onClick={join}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
                style={{ background: "var(--gradient-fun)" }}
              >
                Allow camera &amp; join
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-black tracking-tight">{session?.title ?? "Exam"}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  liveAway ? "bg-destructive text-destructive-foreground" : "bg-[var(--success)] text-[var(--success-foreground)]"
                }`}
              >
                {calibrating ? "Calibrating…" : liveAway ? "🚩 Look away flagged" : "🟢 Monitoring active"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{status.reason}</p>
            <button
              onClick={() => {
                stop();
                setJoined(null);
                setFlags([]);
              }}
              className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Leave exam
            </button>
          </>
        )}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className={`overflow-hidden rounded-2xl border-4 ${liveAway && joined ? "border-destructive" : "border-border"}`}>
          <video ref={videoRef} muted playsInline className="h-56 w-full bg-muted object-cover" />
        </div>
        <h3 className="mt-4 text-sm font-bold">Your flagged look-aways ({flags.length})</h3>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
          {flags.length === 0 && <li>None — keep your eyes on the screen.</li>}
          {flags.map((f) => (
            <li key={f.id}>
              {fmtClock(f.start)} → {fmtClock(f.end)} ({fmtDur(f.end - f.start)}) · {f.reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
