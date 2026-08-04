import { useCallback, useMemo, useRef, useState } from "react";

type Round = { prompt: string; hint?: string; options: string[]; answer: string };

type GameDef = {
  id: string;
  icon: string;
  title: string;
  blurb: string;
  tint: string;
  make: (age: number, level: number) => Round;
};

const WIN_TARGET = 6;
const LIVES = 3;

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rnd(arr.length)];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

function numberRound(answer: number, prompt: string, spread = 6): Round {
  const set = new Set<number>([answer]);
  while (set.size < 4) {
    const wrong = answer + (rnd(2) ? 1 : -1) * (1 + rnd(spread));
    if (wrong >= 0 && wrong !== answer) set.add(wrong);
    else set.add(answer + set.size + 1);
  }
  return { prompt, options: shuffle([...set]).map(String), answer: String(answer) };
}

function wordRound(answer: string, prompt: string, pool: string[], hint?: string): Round {
  const set = new Set<string>([answer]);
  const others = pool.filter((w) => w !== answer);
  while (set.size < 4 && others.length) set.add(pick(others));
  return { prompt, hint, options: shuffle([...set]), answer };
}

const CAPITALS: [string, string][] = [
  ["France", "Paris"], ["Japan", "Tokyo"], ["Egypt", "Cairo"], ["Brazil", "Brasília"],
  ["Canada", "Ottawa"], ["Italy", "Rome"], ["Kenya", "Nairobi"], ["Spain", "Madrid"],
  ["India", "New Delhi"], ["Saudi Arabia", "Riyadh"], ["Norway", "Oslo"], ["Mexico", "Mexico City"],
];
const SPELLINGS: [string, string[]][] = [
  ["because", ["becuase", "becouse", "becaus"]],
  ["friend", ["freind", "frend", "friendd"]],
  ["beautiful", ["beutiful", "beautifull", "beautifull"]],
  ["necessary", ["neccessary", "necesary", "nesessary"]],
  ["separate", ["seperate", "saparate", "separete"]],
  ["rhythm", ["rythm", "rhythem", "rhytm"]],
];
const SCIENCE: [string, string, string[]][] = [
  ["Which planet is known as the Red Planet?", "Mars", ["Venus", "Jupiter", "Mercury"]],
  ["What gas do plants absorb?", "Carbon dioxide", ["Oxygen", "Nitrogen", "Helium"]],
  ["What is H₂O?", "Water", ["Salt", "Sugar", "Acid"]],
  ["How many bones has an adult human?", "206", ["150", "300", "412"]],
  ["What force pulls things down?", "Gravity", ["Friction", "Magnetism", "Tension"]],
  ["Largest organ of the body?", "Skin", ["Liver", "Heart", "Lungs"]],
];
const SYNONYMS: [string, string, string[]][] = [
  ["happy", "joyful", ["angry", "tired", "slow"]],
  ["big", "enormous", ["tiny", "narrow", "empty"]],
  ["quick", "rapid", ["lazy", "heavy", "dull"]],
  ["smart", "clever", ["silly", "rude", "weak"]],
  ["quiet", "silent", ["loud", "bright", "rough"]],
];

function cap(age: number, level: number, kidMax = 10) {
  return age > 0 && age < 10 ? kidMax : Math.min(10 + level * 4, 50);
}

export const GAMES: GameDef[] = [
  {
    id: "multiply", icon: "✖️", title: "Times Table Blast", blurb: "Multiplication sprints", tint: "oklch(0.93 0.07 250)",
    make: (age, lvl) => { const a = 1 + rnd(cap(age, lvl, 6)); const b = 1 + rnd(Math.min(cap(age, lvl, 6), 12)); return numberRound(a * b, `${a} × ${b} = ?`, 10); },
  },
  {
    id: "add", icon: "➕", title: "Addition Rush", blurb: "Fast mental adding", tint: "oklch(0.93 0.08 145)",
    make: (age, lvl) => { const a = 1 + rnd(cap(age, lvl)); const b = 1 + rnd(cap(age, lvl)); return numberRound(a + b, `${a} + ${b} = ?`); },
  },
  {
    id: "sub", icon: "➖", title: "Subtraction Dash", blurb: "Take away, stay sharp", tint: "oklch(0.94 0.08 60)",
    make: (age, lvl) => { let a = 1 + rnd(cap(age, lvl)); let b = 1 + rnd(cap(age, lvl)); if (b > a) [a, b] = [b, a]; return numberRound(a - b, `${a} − ${b} = ?`); },
  },
  {
    id: "divide", icon: "➗", title: "Division Drop", blurb: "Clean divisions only", tint: "oklch(0.93 0.07 300)",
    make: (age, lvl) => { const b = 2 + rnd(Math.min(4 + lvl, 11)); const q = 1 + rnd(Math.min(4 + lvl, 12)); return numberRound(q, `${b * q} ÷ ${b} = ?`); },
  },
  {
    id: "sequence", icon: "🔢", title: "Number Sequence", blurb: "Find the next number", tint: "oklch(0.93 0.07 200)",
    make: (_age, lvl) => { const start = 1 + rnd(9); const step = 2 + rnd(2 + lvl); const s = [0, 1, 2, 3].map((i) => start + step * i); return numberRound(start + step * 4, `${s.join(", ")}, ?`, step + 3); },
  },
  {
    id: "percent", icon: "％", title: "Percent Power", blurb: "Percentages of numbers", tint: "oklch(0.93 0.08 20)",
    make: (_age, lvl) => { const p = pick([10, 20, 25, 50, 5 * (1 + rnd(4))]); const base = (2 + rnd(4 + lvl)) * 20; return numberRound(Math.round((p / 100) * base), `${p}% of ${base} = ?`, 12); },
  },
  {
    id: "fractions", icon: "🍕", title: "Fraction Feast", blurb: "Compare and simplify", tint: "oklch(0.94 0.08 90)",
    make: () => { const d = pick([2, 4, 5, 8, 10]); const n = 1 + rnd(d - 1); return numberRound(Math.round((n / d) * 100), `${n}/${d} as a percent = ? %`, 15); },
  },
  {
    id: "square", icon: "⬛", title: "Square & Root", blurb: "Squares and roots", tint: "oklch(0.92 0.06 265)",
    make: (_age, lvl) => { const n = 2 + rnd(Math.min(8 + lvl, 15)); return Math.random() < 0.5 ? numberRound(n * n, `${n}² = ?`, 14) : numberRound(n, `√${n * n} = ?`, 5); },
  },
  {
    id: "capitals", icon: "🌍", title: "Capital Quest", blurb: "World capitals", tint: "oklch(0.93 0.08 175)",
    make: () => { const [c, cityName] = pick(CAPITALS); return wordRound(cityName, `Capital of ${c}?`, CAPITALS.map((x) => x[1])); },
  },
  {
    id: "spelling", icon: "🔤", title: "Spelling Sprint", blurb: "Pick the correct spelling", tint: "oklch(0.94 0.07 35)",
    make: () => { const [right, wrongs] = pick(SPELLINGS); return { prompt: "Which spelling is correct?", options: shuffle([right, ...wrongs]), answer: right }; },
  },
  {
    id: "science", icon: "🔬", title: "Science Lab", blurb: "Quick science facts", tint: "oklch(0.93 0.07 130)",
    make: () => { const [q, right, wrongs] = pick(SCIENCE); return { prompt: q, options: shuffle([right, ...wrongs]), answer: right }; },
  },
  {
    id: "synonyms", icon: "📚", title: "Word Match", blurb: "Synonyms and vocabulary", tint: "oklch(0.93 0.07 320)",
    make: () => { const [w, right, wrongs] = pick(SYNONYMS); return { prompt: `Which word means the same as “${w}”?`, options: shuffle([right, ...wrongs]), answer: right }; },
  },
];

export default function GameArcade({
  age = 12, onWin,
}: {
  age?: number;
  onWin?: (gameTitle: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [status, setStatus] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const lockRef = useRef(false);
  const rewardedRef = useRef(false);

  const game = useMemo(() => GAMES.find((g) => g.id === activeId) ?? null, [activeId]);

  const startGame = useCallback((g: GameDef) => {
    setActiveId(g.id);
    setCorrect(0);
    setLives(LIVES);
    setStatus("playing");
    setFeedback(null);
    lockRef.current = false;
    rewardedRef.current = false;
    setRound(g.make(age, 1));
  }, [age]);

  const answer = (opt: string) => {
    if (!game || !round || status !== "playing" || lockRef.current) return;
    lockRef.current = true;
    if (opt === round.answer) {
      const next = correct + 1;
      setCorrect(next);
      if (next >= WIN_TARGET) {
        setStatus("won");
        setRound(null);
        if (!rewardedRef.current) { rewardedRef.current = true; onWin?.(game.title); }
        lockRef.current = false;
        return;
      }
      setFeedback("✅ Correct!");
      setRound(game.make(age, next + 1));
    } else {
      const left = lives - 1;
      setLives(left);
      setFeedback(`❌ The answer was ${round.answer}.`);
      if (left <= 0) { setStatus("lost"); setRound(null); lockRef.current = false; return; }
      setRound(game.make(age, correct + 1));
    }
    setTimeout(() => { setFeedback(null); lockRef.current = false; }, 700);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🕹️ Brain Arcade — {GAMES.length} mini-games</h2>
          <p className="text-sm text-muted-foreground">
            Win a game by getting {WIN_TARGET} answers right with {LIVES} lives. Pure brain break — <strong>games never give credits</strong>.
          </p>
        </div>
        {game && (
          <button onClick={() => { setActiveId(null); setStatus("idle"); setRound(null); }} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            ← All games
          </button>
        )}
      </div>

      {!game && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((g) => (
            <button key={g.id} onClick={() => startGame(g)} className="rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-1 hover:border-primary">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: g.tint }}>{g.icon}</div>
              <div className="mt-3 font-bold">{g.title}</div>
              <div className="text-xs text-muted-foreground">{g.blurb}</div>
              <div className="mt-2 text-xs font-semibold text-primary">Win → 🏆 bragging rights</div>
            </button>
          ))}
        </div>
      )}

      {game && (
        <div className="mt-6 rounded-2xl border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
            <span>{game.icon} {game.title}</span>
            <span className="flex gap-2">
              <span className="rounded-full bg-muted px-3 py-1">{correct}/{WIN_TARGET}</span>
              <span className="rounded-full bg-muted px-3 py-1">{"❤️".repeat(Math.max(0, lives)) || "💀"}</span>
            </span>
          </div>

          {status === "playing" && round && (
            <div className="mt-5">
              <div className="text-center text-2xl font-black md:text-3xl">{round.prompt}</div>
              <div className="mx-auto mt-5 grid max-w-lg grid-cols-2 gap-3">
                {round.options.map((o) => (
                  <button key={o} onClick={() => answer(o)} className="rounded-xl border border-border bg-card px-4 py-3 text-base font-bold hover:border-primary hover:bg-accent">
                    {o}
                  </button>
                ))}
              </div>
              {feedback && <p className="mt-4 text-center text-sm font-semibold">{feedback}</p>}
            </div>
          )}

          {status !== "playing" && (
            <div className="mt-6 text-center">
              <div className="text-2xl font-black">
                {status === "won" ? "🏆 You won!" : `💀 Out of lives — ${correct}/${WIN_TARGET} correct`}
              </div>
              <button onClick={() => startGame(game)} className="mt-4 rounded-full px-6 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
                Play again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}