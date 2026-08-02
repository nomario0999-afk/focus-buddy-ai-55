import { useCallback, useEffect, useRef, useState } from "react";

type Op = "+" | "-" | "×";

type Question = { text: string; answer: number; options: number[] };

const LANE_X = [-1, 0, 1];

function makeQuestion(age: number, level: number): Question {
  const kid = age > 0 && age < 10;
  const ops: Op[] = kid ? ["+", "-"] : level > 2 ? ["+", "-", "×"] : ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const cap = kid ? 10 : Math.min(12 + level * 3, 40);
  let a = 1 + Math.floor(Math.random() * cap);
  let b = 1 + Math.floor(Math.random() * (op === "×" ? Math.min(cap, 12) : cap));
  if (op === "-" && b > a) [a, b] = [b, a];
  const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
  const set = new Set<number>([answer]);
  while (set.size < 4) {
    const delta = Math.max(1, Math.round(answer * 0.15)) + Math.floor(Math.random() * 6) - 2;
    const wrong = answer + (Math.random() < 0.5 ? -1 : 1) * (delta || 1);
    if (wrong >= 0) set.add(wrong);
    else set.add(answer + set.size);
  }
  return {
    text: `${a} ${op} ${b} = ?`,
    answer,
    options: [...set].sort(() => Math.random() - 0.5),
  };
}

export default function PortalDriveGame({
  age = 12, onReward,
}: {
  age?: number;
  onReward?: (credits: number) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [lane, setLane] = useState(1);
  const [portalLane, setPortalLane] = useState(1);
  const [z, setZ] = useState(1); // 1 = far, 0 = at the car
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [road, setRoad] = useState(0);
  const raf = useRef<number | null>(null);
  const laneRef = useRef(lane);
  laneRef.current = lane;

  const spawn = useCallback(() => {
    setPortalLane(Math.floor(Math.random() * 3));
    setZ(1);
  }, []);

  const start = () => {
    setPlaying(true); setLives(3); setScore(0); setLevel(1); setLane(1); setQuestion(null); setFeedback(null);
    spawn();
  };

  // Drive loop
  useEffect(() => {
    if (!playing || question) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      setRoad((r) => (r + dt * (0.6 + level * 0.12)) % 1);
      setZ((prev) => {
        const next = prev - dt * (0.16 + level * 0.03);
        if (next <= 0) {
          if (laneRef.current === portalLaneRef.current) {
            setQuestion(makeQuestion(age, levelRef.current));
          } else {
            setFeedback("💨 Missed the portal! Steer into the blue portal lane.");
            setLives((l) => Math.max(0, l - 1));
            setTimeout(() => setFeedback(null), 1400);
          }
          setPortalLane(Math.floor(Math.random() * 3));
          return 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing, question, level, age]);

  const portalLaneRef = useRef(portalLane);
  portalLaneRef.current = portalLane;
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => { if (lives === 0) { setPlaying(false); setQuestion(null); } }, [lives]);

  // Keyboard steering
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setLane((l) => Math.max(0, l - 1));
      if (e.key === "ArrowRight") setLane((l) => Math.min(2, l + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing]);

  const answerQ = (opt: number) => {
    if (!question) return;
    if (opt === question.answer) {
      setScore((s) => s + 10 * level);
      setLevel((l) => Math.min(9, l + 1));
      setFeedback("🎉 Correct! Portal opened.");
      onReward?.(1);
    } else {
      setLives((l) => Math.max(0, l - 1));
      setFeedback(`❌ It was ${question.answer}.`);
    }
    setQuestion(null);
    setTimeout(() => setFeedback(null), 1600);
  };

  const depth = 1 - z; // 0 far → 1 near
  const portalScale = 0.18 + depth * depth * 1.5;
  const portalBottom = 18 + (1 - depth) * 46; // % from bottom

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🎮 Portal Racer — brain break</h2>
          <p className="text-sm text-muted-foreground">
            Drive into the blue portal, then solve the multiplication, addition or subtraction inside.
          </p>
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">⭐ {score}</span>
          <span className="rounded-full bg-muted px-3 py-1">Lvl {level}</span>
          <span className="rounded-full bg-muted px-3 py-1">{"❤️".repeat(lives) || "💀"}</span>
        </div>
      </div>

      {/* 3D road */}
      <div
        className="relative mt-5 h-72 w-full overflow-hidden rounded-2xl md:h-96"
        style={{
          perspective: "420px",
          background: "linear-gradient(180deg, oklch(0.72 0.14 245) 0%, oklch(0.88 0.07 240) 45%, oklch(0.75 0.09 155) 46%, oklch(0.68 0.11 155) 100%)",
        }}
      >
        {/* road plane */}
        <div
          className="absolute bottom-0 left-1/2 h-[60%] w-[220%] -translate-x-1/2 origin-bottom"
          style={{
            transform: "translateX(-50%) rotateX(72deg)",
            background: `repeating-linear-gradient(180deg, oklch(0.35 0.02 260) 0px, oklch(0.35 0.02 260) 60px, oklch(0.32 0.02 260) 60px, oklch(0.32 0.02 260) 120px)`,
            backgroundPositionY: `${road * 120}px`,
          }}
        >
          <div className="absolute inset-y-0 left-1/3 w-1 bg-white/50" />
          <div className="absolute inset-y-0 left-2/3 w-1 bg-white/50" />
        </div>

        {/* portal */}
        {playing && !question && (
          <div
            className="absolute left-1/2 flex items-center justify-center rounded-full"
            style={{
              bottom: `${portalBottom}%`,
              transform: `translateX(calc(-50% + ${LANE_X[portalLane] * (28 + depth * 90)}px)) scale(${portalScale})`,
              width: 120, height: 150,
              background: "radial-gradient(circle, oklch(0.85 0.16 235) 0%, oklch(0.6 0.22 250) 55%, transparent 72%)",
              boxShadow: "0 0 40px oklch(0.62 0.22 250 / 0.8)",
            }}
          >
            <div className="h-[70%] w-[70%] rounded-full border-4 border-white/70" />
          </div>
        )}

        {/* car */}
        <div
          className="absolute bottom-3 left-1/2 transition-transform duration-150"
          style={{ transform: `translateX(calc(-50% + ${LANE_X[lane] * 92}px))` }}
        >
          <div className="relative h-16 w-20">
            <div className="absolute bottom-0 left-1/2 h-10 w-20 -translate-x-1/2 rounded-xl shadow-lg" style={{ background: "linear-gradient(180deg, oklch(0.72 0.19 30), oklch(0.55 0.2 28))" }} />
            <div className="absolute bottom-8 left-1/2 h-7 w-12 -translate-x-1/2 rounded-t-xl" style={{ background: "linear-gradient(180deg, oklch(0.8 0.16 32), oklch(0.62 0.2 28))" }} />
            <div className="absolute bottom-9 left-1/2 h-4 w-9 -translate-x-1/2 rounded-md bg-[oklch(0.9_0.05_230)]" />
            <div className="absolute bottom-0 left-0 h-4 w-4 rounded-full bg-black" />
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-black" />
          </div>
        </div>

        {/* overlays */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 text-center text-white">
            <div className="text-2xl font-black">{lives === 0 ? `Game over — ${score} points` : "🏎️ Portal Racer"}</div>
            <p className="max-w-xs text-sm text-white/85">Use ← → keys or the buttons to steer into the blue portal and answer the maths question.</p>
            <button onClick={start} className="rounded-full bg-white px-6 py-2 text-sm font-bold text-primary hover:opacity-90">
              {lives === 0 ? "Play again" : "Start driving"}
            </button>
          </div>
        )}

        {question && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[oklch(0.3_0.12_255/0.85)] text-white backdrop-blur-sm">
            <div className="text-sm font-semibold uppercase tracking-widest text-white/80">Portal challenge</div>
            <div className="text-4xl font-black tabular-nums">{question.text}</div>
            <div className="grid grid-cols-2 gap-2">
              {question.options.map((o) => (
                <button key={o} onClick={() => answerQ(o)} className="rounded-xl bg-white/95 px-6 py-3 text-lg font-bold text-primary hover:bg-white">
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {feedback && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-sm font-semibold text-white">
            {feedback}
          </div>
        )}
      </div>

      {playing && (
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => setLane((l) => Math.max(0, l - 1))} className="rounded-full border border-border bg-card px-8 py-3 text-lg font-bold hover:bg-accent">←</button>
          <button onClick={() => setPlaying(false)} className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted">Stop</button>
          <button onClick={() => setLane((l) => Math.min(2, l + 1))} className="rounded-full border border-border bg-card px-8 py-3 text-lg font-bold hover:bg-accent">→</button>
        </div>
      )}
    </div>
  );
}
