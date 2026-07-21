import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import focoMascot from "@/assets/foco-mascot.png";

export const Route = createFileRoute("/")({
  component: Index,
});

type Mode = "focus" | "short" | "long";
const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const MODE_LABEL: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function Index() {
  const [mode, setMode] = useState<Mode>("focus");
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          if (mode === "focus") setSessions((n) => n + 1);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setSecondsLeft(DURATIONS[m]);
    setRunning(false);
  };

  const progress = 1 - secondsLeft / DURATIONS[mode];
  const circumference = 2 * Math.PI * 130;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">F</div>
          <span className="text-lg font-bold tracking-tight">Focuser</span>
          <span className="ml-2 hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline">✨ Powered by AI</span>
        </div>
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#for-who" className="hover:text-foreground">For</a>
          <a href="#timer" className="hover:text-foreground">Timer</a>
        </nav>
        <a href="#timer" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90">
          Start Focusing
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pt-8 pb-16 md:grid-cols-2 md:pt-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Your AI Study Buddy
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
            Focus.{" "}
            <span className="text-primary">Learn.</span>{" "}
            <span className="text-[var(--secondary)]">Grow.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            A smarter way to stay focused, build better study habits, and achieve your goals — with a little help from Foco.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#timer" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90">
              Start a focus session
            </a>
            <a href="#features" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent">
              See features
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div><span className="text-2xl font-bold text-foreground">25</span> min sessions</div>
            <div><span className="text-2xl font-bold text-foreground">6</span> smart tools</div>
            <div><span className="text-2xl font-bold text-foreground">100%</span> student-safe</div>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div
            className="absolute inset-0 -z-10 rounded-full opacity-60 blur-3xl"
            style={{ background: "var(--gradient-hero)" }}
          />
          <img
            src={focoMascot}
            alt="Foco, the Focuser AI study mascot"
            width={520}
            height={520}
            className="w-72 drop-shadow-[0_20px_40px_oklch(0.62_0.19_250/0.25)] md:w-96"
          />
        </div>
      </section>

      {/* Timer */}
      <section id="timer" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Focus Timer</h2>
              <p className="text-sm text-muted-foreground">Science-backed Pomodoro sessions to keep you locked in.</p>
            </div>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {(Object.keys(DURATIONS) as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative flex h-72 w-72 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="130" strokeWidth="14" className="fill-none stroke-muted" />
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                />
              </svg>
              <div className="text-center">
                <div className="text-6xl font-black tabular-nums tracking-tight">{formatTime(secondsLeft)}</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">{MODE_LABEL[mode]}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setRunning((r) => !r)}
                className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
              >
                {running ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
              </button>
              <button
                onClick={() => switchMode(mode)}
                className="rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition hover:bg-accent"
              >
                Reset
              </button>
              <div className="ml-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                🏆 {sessions} sessions today
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why students love Focuser</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Six focused tools that turn scattered study time into real progress.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: "🧠", title: "AI Focus Coaching", desc: "Personalized nudges to help you stay on track.", tint: "oklch(0.94 0.05 250)" },
            { icon: "⏱️", title: "Smart Pomodoro", desc: "Guided focus and break cycles that actually work.", tint: "oklch(0.94 0.06 55)" },
            { icon: "📚", title: "AI Study Planner", desc: "A study plan built around your goals and schedule.", tint: "oklch(0.94 0.06 155)" },
            { icon: "📈", title: "Progress Tracking", desc: "See streaks, focus minutes, and topics mastered.", tint: "oklch(0.94 0.05 290)" },
            { icon: "🏅", title: "Rewards & Badges", desc: "Unlock achievements for every milestone.", tint: "oklch(0.95 0.05 85)" },
            { icon: "🤖", title: "AI Homework Helper", desc: "Step-by-step explanations, not just answers.", tint: "oklch(0.94 0.05 220)" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ background: f.tint }}>
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For who */}
      <section id="for-who" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { who: "Students", emoji: "👨‍🎓", line: "Beat distractions and understand more." },
            { who: "Parents", emoji: "👨‍👩‍👧", line: "Real progress insights, no guesswork." },
            { who: "Teachers", emoji: "👩‍🏫", line: "Track class progress and save prep time." },
          ].map((p) => (
            <div key={p.who} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="text-4xl">{p.emoji}</div>
              <h3 className="mt-3 text-xl font-bold">{p.who}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-10 text-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-primary)" }}>
          <h2 className="text-3xl font-black md:text-4xl">Start focusing today.</h2>
          <p className="mx-auto mt-2 max-w-md text-white/90">One app. Endless possibilities. Download Focuser free.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-md">🍎 App Store</button>
            <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-md">▶ Google Play</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Focuser</span>
          <span>Focus. Learn. Grow.</span>
        </div>
      </footer>
    </div>
  );
}
