import { useEffect, useMemo, useRef, useState } from "react";
import PortalDriveGame from "./PortalDriveGame";

type GameProps = { age: number; onReward?: (credits: number) => void };

function randInt(n: number) { return Math.floor(Math.random() * n); }

/* ---------------- Number Rush: 30s timed math sprint ---------------- */
function NumberRush({ age, onReward }: GameProps) {
  const kid = age > 0 && age < 10;
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState(() => makeQ());
  const [flash, setFlash] = useState<string | null>(null);

  function makeQ() {
    const cap = kid ? 10 : 20;
    const ops = kid ? ["+", "-"] : ["+", "-", "×"];
    const op = ops[randInt(ops.length)];
    let a = 1 + randInt(cap), b = 1 + randInt(op === "×" ? Math.min(cap, 12) : cap);
    if (op === "-" && b > a) [a, b] = [b, a];
    const answer = op === "+" ? a + b : op === "-" ? a - b : a * b;
    const set = new Set<number>([answer]);
    while (set.size < 4) set.add(Math.max(0, answer + randInt(11) - 5));
    return { text: `${a} ${op} ${b}`, answer, options: [...set].sort(() => Math.random() - 0.5) };
  }

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => {
      if (t <= 1) { setPlaying(false); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const start = () => { setPlaying(true); setTime(30); setScore(0); setQ(makeQ()); };

  const pick = (o: number) => {
    if (o === q.answer) { setScore((s) => s + 1); onReward?.(1); setFlash("✅"); }
    else { setFlash("❌"); setTime((t) => Math.max(0, t - 2)); }
    setQ(makeQ());
    setTimeout(() => setFlash(null), 400);
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-6 text-center">
      <div className="flex gap-2 text-sm font-semibold">
        <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">⭐ {score}</span>
        <span className="rounded-full bg-muted px-3 py-1 tabular-nums">⏱ {time}s</span>
      </div>
      {playing ? (
        <>
          <div className="text-5xl font-black tabular-nums">{q.text} {flash}</div>
          <div className="grid w-full max-w-sm grid-cols-2 gap-2">
            {q.options.map((o) => (
              <button key={o} onClick={() => pick(o)} className="rounded-xl bg-card px-6 py-3 text-lg font-bold shadow-[var(--shadow-soft)] hover:bg-accent">{o}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="max-w-sm text-sm text-muted-foreground">
            {time === 0 ? `Time! You scored ${score} — +${score} credits earned.` : "Answer as many questions as you can in 30 seconds. Wrong answers cost 2 seconds. +1 credit per correct answer."}
          </p>
          <button onClick={start} className="rounded-full px-6 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
            {time === 0 ? "Play again" : "Start sprint"}
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- Memory Match: pair the emoji cards ---------------- */
const MEMO = ["🦊", "🐨", "🐼", "🦉", "🐯", "🦄", "🐙", "🐸"];

function MemoryMatch({ onReward }: GameProps) {
  const [deck, setDeck] = useState<string[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);

  const reset = () => {
    const picks = MEMO.slice(0, 6);
    setDeck([...picks, ...picks].sort(() => Math.random() - 0.5));
    setOpen([]); setDone([]); setMoves(0); lock.current = false;
  };
  useEffect(reset, []);

  const flip = (i: number) => {
    if (lock.current || open.includes(i) || done.includes(i)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lock.current = true;
      setTimeout(() => {
        if (deck[next[0]] === deck[next[1]]) {
          setDone((d) => {
            const nd = [...d, ...next];
            if (nd.length === deck.length) onReward?.(3);
            return nd;
          });
        }
        setOpen([]); lock.current = false;
      }, 650);
    }
  };

  const won = deck.length > 0 && done.length === deck.length;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-6 text-center">
      <div className="flex gap-2 text-sm font-semibold">
        <span className="rounded-full bg-muted px-3 py-1">Moves {moves}</span>
        {won && <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">🎉 +3 credits</span>}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {deck.map((c, i) => {
          const shown = open.includes(i) || done.includes(i);
          return (
            <button key={i} onClick={() => flip(i)}
              className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl shadow-[var(--shadow-soft)] transition"
              style={{ background: shown ? "var(--card)" : "var(--gradient-fun)" }}>
              {shown ? c : ""}
            </button>
          );
        })}
      </div>
      <button onClick={reset} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Shuffle & restart</button>
    </div>
  );
}

/* ---------------- Reaction Tap: focus reflex trainer ---------------- */
function ReactionTap({ onReward }: GameProps) {
  const [state, setState] = useState<"idle" | "wait" | "go" | "result" | "early">("idle");
  const [ms, setMs] = useState(0);
  const startAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const begin = () => {
    setState("wait");
    timer.current = setTimeout(() => { startAt.current = performance.now(); setState("go"); }, 1200 + randInt(2600));
  };
  const hit = () => {
    if (state === "wait") { if (timer.current) clearTimeout(timer.current); setState("early"); return; }
    if (state === "go") {
      const t = Math.round(performance.now() - startAt.current);
      setMs(t); setState("result");
      if (t < 400) onReward?.(1);
    }
  };

  const bg = state === "go" ? "oklch(0.75 0.17 150)" : state === "wait" ? "oklch(0.72 0.16 30)" : "var(--muted)";

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/40 p-6 text-center">
      <button onClick={state === "idle" || state === "result" || state === "early" ? begin : hit}
        className="flex h-48 w-full max-w-md items-center justify-center rounded-2xl text-xl font-black text-foreground"
        style={{ background: bg }}>
        {state === "idle" && "Tap to start"}
        {state === "wait" && "Wait for green…"}
        {state === "go" && "TAP NOW!"}
        {state === "result" && `${ms} ms — tap to retry`}
        {state === "early" && "Too early! Tap to retry"}
      </button>
      <p className="max-w-sm text-sm text-muted-foreground">Train your reaction and attention. Beat 400 ms to earn +1 credit.</p>
    </div>
  );
}

/* ---------------- Arcade shell ---------------- */
export default function GamesArcade({ age = 12, onReward }: { age?: number; onReward?: (credits: number) => void }) {
  const games = useMemo(() => ([
    { id: "portal", label: "🏎️ Portal Racer", desc: "Drive into the blue portal and solve the maths inside." },
    { id: "rush", label: "⚡ Number Rush", desc: "30-second maths sprint — how many can you get?" },
    { id: "memory", label: "🧠 Memory Match", desc: "Flip the cards and find every pair." },
    { id: "reflex", label: "🎯 Reaction Tap", desc: "Tap the moment it turns green." },
  ]), []);
  const [active, setActive] = useState("portal");
  const current = games.find((g) => g.id === active)!;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <h2 className="text-2xl font-bold tracking-tight">🕹️ Brain break arcade</h2>
      <p className="text-sm text-muted-foreground">Four mini games to reset your focus — and earn credits while you play.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {games.map((g) => (
          <button key={g.id} onClick={() => setActive(g.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${active === g.id ? "text-primary-foreground shadow-[var(--shadow-soft)]" : "border border-border bg-card hover:bg-muted"}`}
            style={active === g.id ? { background: "var(--gradient-fun)" } : undefined}>
            {g.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{current.desc}</p>

      <div className="mt-4">
        {active === "portal" && <PortalDriveGame age={age} onReward={onReward} />}
        {active === "rush" && <NumberRush age={age} onReward={onReward} />}
        {active === "memory" && <MemoryMatch age={age} onReward={onReward} />}
        {active === "reflex" && <ReactionTap age={age} onReward={onReward} />}
      </div>
    </div>
  );
}