import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENCY, GAME_WIN_CREDITS } from "@/lib/profiles";
import type { GameLock } from "@/lib/game-unlocks";
import { LockHeaderBar, LockTag } from "@/components/GameLockUI";

type GameId = "dodger" | "reflex" | "catcher";

const GAMES: { id: GameId; icon: string; title: string; desc: string; tint: string }[] = [
  { id: "dodger", icon: "🏎️", title: "Neon Cube Dodger", desc: "Steer down a 3D tunnel and dodge the blocks.", tint: "oklch(0.94 0.06 250)" },
  { id: "reflex", icon: "🎨", title: "Colour Cube Reflex", desc: "Spin the 3D cube and tap the matching colour.", tint: "oklch(0.94 0.06 330)" },
  { id: "catcher", icon: "⭐", title: "Star Catcher 3D", desc: "Catch falling stars on a tilted 3D floor.", tint: "oklch(0.95 0.06 85)" },
];

function Shell({
  title, onBack, children,
}: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-bold">{title}</div>
        <button onClick={onBack} className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-muted-foreground hover:bg-muted">
          Back
        </button>
      </div>
      {children}
    </div>
  );
}

/* ── Game 1: 3D tunnel dodger ─────────────────────────────── */
function Dodger({ onWin }: { onWin: () => void }) {
  const [lane, setLane] = useState(1);
  const [blocks, setBlocks] = useState<{ id: number; lane: number; z: number }[]>([]);
  const [time, setTime] = useState(0);
  const [over, setOver] = useState<null | "won" | "lost">(null);
  const laneRef = useRef(1);
  laneRef.current = lane;
  const GOAL = 20;

  useEffect(() => {
    if (over) return;
    let id = 0;
    const tick = setInterval(() => {
      setBlocks((prev) => {
        const moved = prev.map((b) => ({ ...b, z: b.z + 6 })).filter((b) => b.z < 105);
        if (Math.random() < 0.28) moved.push({ id: id++, lane: Math.floor(Math.random() * 3), z: 0 });
        if (moved.some((b) => b.z > 82 && b.z < 96 && b.lane === laneRef.current)) setOver("lost");
        return moved;
      });
      setTime((t) => {
        const n = t + 0.1;
        if (n >= GOAL) setOver("won");
        return n;
      });
    }, 100);
    return () => clearInterval(tick);
  }, [over]);

  useEffect(() => { if (over === "won") onWin(); }, [over, onWin]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setLane((l) => Math.max(0, l - 1));
      if (e.key === "ArrowRight") setLane((l) => Math.min(2, l + 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const reset = () => { setBlocks([]); setTime(0); setLane(1); setOver(null); };

  return (
    <>
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span className="rounded-full bg-muted px-3 py-1">⏱ {Math.min(GOAL, time).toFixed(1)}s / {GOAL}s</span>
        <span className="rounded-full bg-muted px-3 py-1">← → to steer</span>
      </div>

      <div
        className="relative mx-auto mt-4 h-64 max-w-xl overflow-hidden rounded-2xl"
        style={{ perspective: "420px", background: "linear-gradient(180deg, oklch(0.28 0.09 265), oklch(0.16 0.06 265))" }}
      >
        <div className="absolute inset-0" style={{ transform: "rotateX(58deg)", transformStyle: "preserve-3d" }}>
          {[0, 1, 2].map((l) => (
            <div key={l} className="absolute top-0 h-full" style={{ left: `${8 + l * 28}%`, width: "28%", borderLeft: "2px dashed oklch(0.7 0.15 250 / 0.5)" }} />
          ))}
        </div>
        {blocks.map((b) => {
          const s = 0.25 + (b.z / 100) * 1.1;
          return (
            <div
              key={b.id}
              className="absolute rounded-md"
              style={{
                left: `${22 + b.lane * 28}%`,
                top: `${10 + b.z * 0.72}%`,
                width: `${18 * s}%`, height: `${34 * s}px`,
                transform: "translate(-50%,-50%)",
                background: "linear-gradient(180deg, oklch(0.75 0.2 25), oklch(0.55 0.2 25))",
                boxShadow: "0 0 18px oklch(0.7 0.2 25 / 0.6)",
              }}
            />
          );
        })}
        <div
          className="absolute text-3xl"
          style={{ left: `${22 + lane * 28}%`, bottom: "8%", transform: "translateX(-50%)", filter: "drop-shadow(0 0 10px oklch(0.8 0.2 200))" }}
        >
          🏎️
        </div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
            <div className="text-2xl font-black text-white">{over === "won" ? "🎉 Survived!" : "💥 Crashed"}</div>
            <button onClick={reset} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black">Play again</button>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-center gap-3">
        <button onClick={() => setLane((l) => Math.max(0, l - 1))} className="rounded-xl bg-muted px-6 py-3 text-lg font-bold hover:bg-accent">←</button>
        <button onClick={() => setLane((l) => Math.min(2, l + 1))} className="rounded-xl bg-muted px-6 py-3 text-lg font-bold hover:bg-accent">→</button>
      </div>
    </>
  );
}

/* ── Game 2: spinning 3D colour cube ──────────────────────── */
const COLOURS = [
  { name: "Red", css: "oklch(0.62 0.22 25)" },
  { name: "Blue", css: "oklch(0.6 0.19 250)" },
  { name: "Green", css: "oklch(0.68 0.17 150)" },
  { name: "Yellow", css: "oklch(0.85 0.16 95)" },
  { name: "Purple", css: "oklch(0.58 0.2 300)" },
  { name: "Orange", css: "oklch(0.72 0.18 55)" },
];

function Reflex({ onWin }: { onWin: () => void }) {
  const [target, setTarget] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState<null | "won" | "lost">(null);
  const GOAL = 8;

  const next = () => setTarget(Math.floor(Math.random() * COLOURS.length));

  const tap = (i: number) => {
    if (over) return;
    if (i === target) {
      const s = score + 1;
      setScore(s);
      if (s >= GOAL) { setOver("won"); onWin(); return; }
      next();
    } else setOver("lost");
  };

  const reset = () => { setScore(0); setOver(null); next(); };

  return (
    <>
      <div className="mt-4 text-center text-sm font-semibold text-muted-foreground">
        Tap the colour named on the spinning cube — {score}/{GOAL}
      </div>
      <div className="mx-auto mt-6 flex h-40 items-center justify-center" style={{ perspective: "600px" }}>
        <div
          className="flex h-24 w-24 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{
            background: COLOURS[(target + 3) % COLOURS.length].css,
            animation: "spin3d 3s linear infinite",
            transformStyle: "preserve-3d",
            boxShadow: "0 18px 40px oklch(0 0 0 / 0.25)",
          }}
        >
          {COLOURS[target].name}
        </div>
      </div>
      <style>{`@keyframes spin3d{from{transform:rotateX(0) rotateY(0)}to{transform:rotateX(360deg) rotateY(360deg)}}`}</style>
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
        {COLOURS.map((c, i) => (
          <button key={c.name} onClick={() => tap(i)} className="h-12 rounded-xl font-bold text-white" style={{ background: c.css }}>
            {c.name}
          </button>
        ))}
      </div>
      {over && (
        <div className="mt-4 text-center">
          <div className="text-xl font-black">{over === "won" ? "🎉 Nailed it!" : "❌ Wrong colour"}</div>
          <button onClick={reset} className="mt-2 rounded-full px-5 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
            Play again
          </button>
        </div>
      )}
    </>
  );
}

/* ── Game 3: star catcher on a tilted 3D floor ────────────── */
function Catcher({ onWin }: { onWin: () => void }) {
  const [x, setX] = useState(50);
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [over, setOver] = useState<null | "won" | "lost">(null);
  const xRef = useRef(50);
  xRef.current = x;
  const GOAL = 12;

  useEffect(() => {
    if (over) return;
    let id = 0;
    const t = setInterval(() => {
      setStars((prev) => {
        const moved = prev.map((s) => ({ ...s, y: s.y + 5 }));
        const kept: typeof moved = [];
        let gained = 0, lost = 0;
        for (const s of moved) {
          if (s.y >= 88) {
            if (Math.abs(s.x - xRef.current) < 12) gained++; else lost++;
          } else kept.push(s);
        }
        if (gained) setScore((v) => { const n = v + gained; if (n >= GOAL) setOver("won"); return n; });
        if (lost) setMissed((v) => { const n = v + lost; if (n >= 5) setOver("lost"); return n; });
        if (Math.random() < 0.32) kept.push({ id: id++, x: 8 + Math.random() * 84, y: 0 });
        return kept;
      });
    }, 110);
    return () => clearInterval(t);
  }, [over]);

  useEffect(() => { if (over === "won") onWin(); }, [over, onWin]);

  const reset = () => { setStars([]); setScore(0); setMissed(0); setOver(null); };

  return (
    <>
      <div className="mt-4 flex justify-between text-sm font-semibold">
        <span className="rounded-full bg-muted px-3 py-1">⭐ {score}/{GOAL}</span>
        <span className="rounded-full bg-muted px-3 py-1">Missed {missed}/5</span>
      </div>
      <div
        className="relative mx-auto mt-4 h-64 max-w-xl overflow-hidden rounded-2xl"
        style={{ perspective: "500px", background: "linear-gradient(180deg, oklch(0.3 0.1 290), oklch(0.18 0.07 290))" }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setX(((e.clientX - r.left) / r.width) * 100);
        }}
      >
        <div className="absolute bottom-0 h-24 w-full" style={{ transform: "rotateX(62deg)", background: "repeating-linear-gradient(90deg, oklch(0.6 0.15 290 / .35) 0 2px, transparent 2px 28px)" }} />
        {stars.map((s) => (
          <div key={s.id} className="absolute text-2xl" style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%,-50%) scale(${0.5 + s.y / 120})` }}>⭐</div>
        ))}
        <div className="absolute bottom-3 text-3xl" style={{ left: `${x}%`, transform: "translateX(-50%)" }}>🧺</div>
        {over && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <div className="text-2xl font-black text-white">{over === "won" ? "🎉 Caught them all!" : "😅 Too many misses"}</div>
            <button onClick={reset} className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black">Play again</button>
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-center gap-3">
        <button onClick={() => setX((v) => Math.max(4, v - 10))} className="rounded-xl bg-muted px-6 py-3 text-lg font-bold hover:bg-accent">←</button>
        <button onClick={() => setX((v) => Math.min(96, v + 10))} className="rounded-xl bg-muted px-6 py-3 text-lg font-bold hover:bg-accent">→</button>
      </div>
    </>
  );
}

export default function FunGames3D({
  unlocked, streak, onWin, lock,
}: { unlocked: boolean; streak: number; onWin?: (credits: number) => void; lock?: GameLock }) {
  const [active, setActive] = useState<GameId | null>(null);
  const [wonIds, setWonIds] = useState<GameId[]>([]);
  const [lockMsg, setLockMsg] = useState<string | null>(null);

  const open = useCallback((id: GameId) => {
    if (lock && !lock.isUnlocked(id)) {
      const err = lock.unlock(id);
      if (err) { setLockMsg(err); return; }
    }
    setLockMsg(null);
    setActive(id);
  }, [lock]);

  const win = useCallback((id: GameId) => {
    setWonIds((prev) => {
      if (prev.includes(id)) return prev;
      onWin?.(GAME_WIN_CREDITS);
      return [...prev, id];
    });
  }, [onWin]);

  const game = GAMES.find((g) => g.id === active) ?? null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🎮 3D fun zone — no maths</h2>
          <p className="text-sm text-muted-foreground">
            Pure-fun 3D games, unlocked after your first focus streak. Win one → +{GAME_WIN_CREDITS} {CURRENCY} (once per game).
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">🔥 streak {streak}</span>
      </div>

      {lock && <LockHeaderBar lock={lock} />}
      {lockMsg && <p className="mt-2 text-sm font-semibold text-destructive">{lockMsg}</p>}

      {!unlocked ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="text-3xl">🔒</div>
          <p className="mt-2 text-sm font-semibold">Finish one focus session to unlock the 3D fun zone.</p>
          <p className="text-xs text-muted-foreground">Your reward for staying focused — no maths, just play.</p>
        </div>
      ) : !game ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => open(g.id)}
              className="rounded-2xl border border-border p-4 text-left transition hover:-translate-y-1 hover:border-primary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: g.tint }}>{g.icon}</div>
              <div className="mt-3 text-sm font-bold">{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.desc}</div>
              <div className="mt-2 text-xs font-semibold text-primary">
                {lock
                  ? <LockTag lock={lock} id={g.id} wonLabel={wonIds.includes(g.id) ? "✅ Won — play for fun" : `Win → +${GAME_WIN_CREDITS}`} />
                  : (wonIds.includes(g.id) ? "✅ Won — play for fun" : `Win → +${GAME_WIN_CREDITS}`)}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Shell title={`${game.icon} ${game.title}`} onBack={() => setActive(null)}>
          {game.id === "dodger" && <Dodger onWin={() => win("dodger")} />}
          {game.id === "reflex" && <Reflex onWin={() => win("reflex")} />}
          {game.id === "catcher" && <Catcher onWin={() => win("catcher")} />}
        </Shell>
      )}
    </div>
  );
}