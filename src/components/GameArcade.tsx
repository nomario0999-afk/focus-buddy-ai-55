import { useCallback, useMemo, useState } from "react";
import { CURRENCY, GAME_WIN_CREDITS } from "@/lib/profiles";
import type { GameLock } from "@/lib/game-unlocks";
import { LockHeaderBar, LockTag } from "@/components/GameLockUI";

type Q = { text: string; answer: string; options: string[] };

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rnd(arr.length)];

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function numQ(text: string, answer: number, spread = 6): Q {
  const set = new Set<string>([String(answer)]);
  let guard = 0;
  while (set.size < 4 && guard++ < 60) {
    const delta = 1 + rnd(spread);
    const wrong = answer + (Math.random() < 0.5 ? -delta : delta);
    if (wrong >= 0 && wrong !== answer) set.add(String(wrong));
  }
  let filler = answer + spread;
  while (set.size < 4) set.add(String(++filler));
  return { text, answer: String(answer), options: shuffle([...set]) };
}

function choiceQ(text: string, answer: string, others: string[]): Q {
  return { text, answer, options: shuffle([answer, ...others.slice(0, 3)]) };
}

export type ArcadeGame = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  tint: string;
  make: (lvl: number) => Q;
};

export const GAMES: ArcadeGame[] = [
  {
    id: "multiply", icon: "✖️", title: "Times Table Turbo", desc: "Multiplication sprints.", tint: "oklch(0.94 0.06 250)",
    make: (l) => { const a = 2 + rnd(4 + l * 2), b = 2 + rnd(9 + l); return numQ(`${a} × ${b} = ?`, a * b, Math.max(4, Math.round(a * b * 0.2))); },
  },
  {
    id: "add", icon: "➕", title: "Adding Rockets", desc: "Fast addition.", tint: "oklch(0.94 0.06 155)",
    make: (l) => { const a = 2 + rnd(10 + l * 6), b = 2 + rnd(10 + l * 6); return numQ(`${a} + ${b} = ?`, a + b); },
  },
  {
    id: "sub", icon: "➖", title: "Subtract Sprint", desc: "Take-away race.", tint: "oklch(0.95 0.06 85)",
    make: (l) => { let a = 5 + rnd(15 + l * 6), b = 1 + rnd(14 + l * 4); if (b > a) [a, b] = [b, a]; return numQ(`${a} − ${b} = ?`, a - b); },
  },
  {
    id: "divide", icon: "➗", title: "Divide Dash", desc: "Clean divisions.", tint: "oklch(0.94 0.05 290)",
    make: (l) => { const b = 2 + rnd(6 + l), r = 2 + rnd(8 + l); return numQ(`${b * r} ÷ ${b} = ?`, r); },
  },
  {
    id: "mixed", icon: "🎲", title: "Mixed Ops Mayhem", desc: "All four operations.", tint: "oklch(0.94 0.05 220)",
    make: (l) => {
      const op = pick(["+", "−", "×"]);
      const a = 2 + rnd(9 + l * 3), b = 2 + rnd(9 + l);
      const ans = op === "+" ? a + b : op === "−" ? Math.abs(a - b) : a * b;
      return numQ(`${Math.max(a, b)} ${op} ${Math.min(a, b)} = ?`, op === "−" ? Math.max(a, b) - Math.min(a, b) : ans);
    },
  },
  {
    id: "squares", icon: "⬛", title: "Square Squad", desc: "Squares and roots.", tint: "oklch(0.93 0.06 30)",
    make: (l) => { const a = 2 + rnd(8 + l); return Math.random() < 0.5 ? numQ(`${a}² = ?`, a * a, 8) : numQ(`√${a * a} = ?`, a, 4); },
  },
  {
    id: "double", icon: "🪞", title: "Double or Half", desc: "Doubles and halves.", tint: "oklch(0.94 0.06 195)",
    make: (l) => { const a = 2 + rnd(20 + l * 5); return Math.random() < 0.5 ? numQ(`Double ${a} = ?`, a * 2) : numQ(`Half of ${a * 2} = ?`, a); },
  },
  {
    id: "missing", icon: "❓", title: "Missing Number", desc: "Fill in the blank.", tint: "oklch(0.94 0.06 320)",
    make: (l) => { const a = 2 + rnd(10 + l * 3), b = 2 + rnd(10 + l * 3); return numQ(`${a} + ___ = ${a + b}`, b); },
  },
  {
    id: "compare", icon: "⚖️", title: "Bigger or Smaller", desc: "Compare two sums.", tint: "oklch(0.95 0.05 60)",
    make: (l) => {
      const a = 2 + rnd(9 + l), b = 2 + rnd(9 + l), c = 2 + rnd(9 + l), d = 2 + rnd(9 + l);
      const left = a * b, right = c + d * 2;
      const ans = left > right ? ">" : left < right ? "<" : "=";
      return choiceQ(`${a}×${b}  ?  ${c}+${d}×2`, ans, [">", "<", "="].filter((s) => s !== ans));
    },
  },
  {
    id: "percent", icon: "％", title: "Percent Power", desc: "Percentages of numbers.", tint: "oklch(0.94 0.06 140)",
    make: () => { const p = pick([10, 20, 25, 50]); const base = (2 + rnd(9)) * 20; return numQ(`${p}% of ${base} = ?`, (base * p) / 100, 8); },
  },
  {
    id: "fractions", icon: "🍰", title: "Fraction Feast", desc: "Fractions of amounts.", tint: "oklch(0.94 0.06 15)",
    make: () => { const d = pick([2, 3, 4, 5]); const n = 1 + rnd(d - 1); const whole = d * (2 + rnd(8)); return numQ(`${n}/${d} of ${whole} = ?`, (whole / d) * n, 6); },
  },
  {
    id: "round", icon: "🎯", title: "Rounding Rush", desc: "Round to the nearest 10.", tint: "oklch(0.94 0.05 265)",
    make: () => { const a = 11 + rnd(280); return numQ(`Round ${a} to nearest 10`, Math.round(a / 10) * 10, 20); },
  },
  {
    id: "sequence", icon: "🔢", title: "Sequence Sleuth", desc: "What comes next?", tint: "oklch(0.94 0.06 110)",
    make: (l) => { const start = 1 + rnd(9), step = 2 + rnd(3 + l); const s = [0, 1, 2, 3].map((i) => start + step * i); return numQ(`${s.join(", ")}, ?`, start + step * 4, step + 3); },
  },
  {
    id: "oddeven", icon: "🧠", title: "Odd One Out", desc: "Spot the odd number.", tint: "oklch(0.95 0.05 340)",
    make: () => {
      const evens = shuffle([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]).slice(0, 3).map(String);
      const odd = String(1 + 2 * rnd(10));
      return choiceQ("Which number is odd?", odd, evens);
    },
  },
  {
    id: "money", icon: "💰", title: "Money Match", desc: "Add up the change.", tint: "oklch(0.94 0.06 175)",
    make: (l) => { const a = 5 * (1 + rnd(9 + l)), b = 5 * (1 + rnd(9 + l)); return numQ(`$${a} + $${b} = $?`, a + b, 15); },
  },
  {
    id: "time", icon: "⏰", title: "Time Traveller", desc: "Minutes and hours.", tint: "oklch(0.94 0.05 45)",
    make: () => { const h = 1 + rnd(5); return Math.random() < 0.5 ? numQ(`${h} hours = ? minutes`, h * 60, 30) : numQ(`${h * 60} minutes = ? hours`, h, 3); },
  },
];

const ROUNDS = 5;
const LIVES = 3;

export default function GameArcade({ onWin, lock }: { onWin?: (credits: number) => void; lock?: GameLock }) {
  const [gameId, setGameId] = useState<string | null>(null);
  const [q, setQ] = useState<Q | null>(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [wonIds, setWonIds] = useState<string[]>([]);
  const [lockMsg, setLockMsg] = useState<string | null>(null);

  const game = useMemo(() => GAMES.find((g) => g.id === gameId) ?? null, [gameId]);

  const start = useCallback((g: ArcadeGame) => {
    setGameId(g.id); setCorrect(0); setLives(LIVES); setStatus("playing"); setFeedback(null);
    setQ(g.make(1));
  }, []);

  const tryStart = useCallback((g: ArcadeGame) => {
    if (lock && !lock.isUnlocked(g.id)) {
      const err = lock.unlock(g.id);
      if (err) { setLockMsg(err); return; }
    }
    setLockMsg(null);
    start(g);
  }, [lock, start]);

  const answer = useCallback((opt: string) => {
    if (!game || !q || status !== "playing") return;
    if (opt === q.answer) {
      const next = correct + 1;
      setCorrect(next);
      if (next >= ROUNDS) {
        setStatus("won");
        setQ(null);
        // Reward is granted once per game, never per question.
        setWonIds((prev) => {
          if (prev.includes(game.id)) { setFeedback(`Already won today — no extra ${CURRENCY}.`); return prev; }
          onWin?.(GAME_WIN_CREDITS);
          setFeedback(`+${GAME_WIN_CREDITS} ${CURRENCY}!`);
          return [...prev, game.id];
        });
        return;
      }
      setFeedback("✅ Correct!");
      setQ(game.make(1 + next));
    } else {
      const left = lives - 1;
      setLives(left);
      setFeedback(`❌ It was ${q.answer}.`);
      if (left <= 0) { setStatus("lost"); setQ(null); return; }
      setQ(game.make(1 + correct));
    }
  }, [game, q, status, correct, lives, onWin]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🕹️ Game arcade — {GAMES.length} games</h2>
          <p className="text-sm text-muted-foreground">
            Answer {ROUNDS} questions in a row with {LIVES} lives. Win a game → +{GAME_WIN_CREDITS} {CURRENCY} (once per game, per visit).
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">🏆 {wonIds.length}/{GAMES.length} won</span>
      </div>

      {lock && <LockHeaderBar lock={lock} />}
      {lockMsg && <p className="mt-2 text-sm font-semibold text-destructive">{lockMsg}</p>}

      {!game && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => tryStart(g)}
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
      )}

      {game && (
        <div className="mt-6 rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold">{game.icon} {game.title}</div>
            <div className="flex gap-2 text-sm font-semibold">
              <span className="rounded-full bg-muted px-3 py-1">{correct}/{ROUNDS}</span>
              <span className="rounded-full bg-muted px-3 py-1">{"❤️".repeat(lives) || "💀"}</span>
              <button onClick={() => { setGameId(null); setStatus("idle"); setQ(null); setFeedback(null); }} className="rounded-full border border-border px-3 py-1 text-muted-foreground hover:bg-muted">
                Back
              </button>
            </div>
          </div>

          {status === "playing" && q && (
            <>
              <div className="mt-6 text-center text-3xl font-black tabular-nums">{q.text}</div>
              <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <button key={o} onClick={() => answer(o)} className="rounded-xl bg-muted px-6 py-3 text-lg font-bold hover:bg-accent">
                    {o}
                  </button>
                ))}
              </div>
            </>
          )}

          {(status === "won" || status === "lost") && (
            <div className="mt-6 text-center">
              <div className="text-2xl font-black">{status === "won" ? "🎉 You won!" : "💀 Out of lives"}</div>
              <p className="mt-1 text-sm text-muted-foreground">{feedback}</p>
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => start(game)} className="rounded-full px-5 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
                  Play again
                </button>
                <button onClick={() => { setGameId(null); setStatus("idle"); setFeedback(null); }} className="rounded-full border border-border px-5 py-2 text-sm font-semibold">
                  All games
                </button>
              </div>
            </div>
          )}

          {status === "playing" && feedback && (
            <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">{feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}