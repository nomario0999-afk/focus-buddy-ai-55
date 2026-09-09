import { useCallback, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateQuiz, type QuizQuestion } from "@/lib/quiz.functions";
import {
  QUIZ_SUBJECTS, useQuizProgress, rewardForLevel, xpForLevel, accuracyBonus, type SubjectDef,
} from "@/lib/quiz-progress";
import { CURRENCY } from "@/lib/profiles";

type Props = {
  profileId: string | null;
  grade?: string;
  subscribed?: boolean;
  onWin?: (credits: number) => void;
};

type Answered = { correct: boolean; text: string };

export default function QuizJourney({ profileId, grade = "", subscribed = false, onWin }: Props) {
  const run = useServerFn(generateQuiz);
  const { data, forSubject, complete } = useQuizProgress(profileId);

  const [subject, setSubject] = useState<SubjectDef | null>(null);
  const [level, setLevel] = useState(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [reveal, setReveal] = useState<Answered | null>(null);
  const [result, setResult] = useState<null | { score: number; accuracy: number; xp: number; focalera: number; passed: boolean }>(null);

  // per-question working state
  const [typed, setTyped] = useState("");
  const [matched, setMatched] = useState<Record<number, string>>({});

  const prog = subject ? forSubject(subject.id) : null;
  const current = questions[index];

  const startLevel = useCallback(async (s: SubjectDef, lvl: number) => {
    setSubject(s); setLevel(lvl); setResult(null); setError(null); setReveal(null);
    setQuestions([]); setAnswers([]); setIndex(0); setTyped(""); setMatched({});
    setLoading(true);
    try {
      const res = await run({
        data: {
          subject: s.title, level: lvl, currentAffairs: Boolean(s.currentAffairs), grade,
          seen: forSubject(s.id).seen.slice(-40),
        },
      });
      setPeriod(res.period);
      if (res.source === "unavailable" || res.questions.length === 0) {
        setError(res.note ?? "Questions are temporarily unavailable. Please try again in a moment.");
      } else {
        setQuestions(res.questions);
      }
    } catch {
      setError("Questions are temporarily unavailable. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [run, grade, forSubject]);

  const submit = useCallback((given: Answered) => {
    if (reveal) return;
    setReveal(given);
    setAnswers((a) => [...a, given]);
  }, [reveal]);

  const next = useCallback(() => {
    setReveal(null); setTyped(""); setMatched({});
    if (index + 1 < questions.length) { setIndex((i) => i + 1); return; }
    // finish the level
    const correct = answers.filter((a) => a.correct).length;
    const accuracy = Math.round((correct / questions.length) * 100);
    const score = accuracy; // score out of 100
    if (!subject) return;
    const out = complete(subject.id, level, accuracy, questions.map((q) => q.q));
    if (out.focalera > 0) onWin?.(out.focalera);
    setResult({ score, accuracy, xp: out.xp, focalera: out.focalera, passed: out.passed });
  }, [index, questions, answers, subject, level, complete, onWin]);

  const backToMap = () => { setQuestions([]); setResult(null); setError(null); setReveal(null); };

  const unlocked = useMemo(() => (prog ? prog.level : 1), [prog]);
  const mapLevels = useMemo(() => Array.from({ length: Math.max(unlocked + 4, 8) }, (_, i) => i + 1), [unlocked]);

  /* ── Subject picker ─────────────────────────────────────────── */
  if (!subject) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <Header totalXp={data.totalXp} streak={data.quizStreak} owner={owner} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUIZ_SUBJECTS.map((s) => {
            const p = forSubject(s.id);
            const locked = Boolean(s.premium) && !subscribed;
            return (
              <button
                key={s.id}
                onClick={() => (locked ? undefined : setSubject(s))}
                className={`rounded-2xl border p-4 text-left transition ${
                  locked ? "cursor-not-allowed border-dashed border-border opacity-70" : "border-border hover:bg-muted"
                }`}
              >
                <div className="text-3xl" aria-hidden="true">{s.emoji}</div>
                <div className="mt-2 flex items-center gap-1.5 text-sm font-bold">
                  {s.title} {s.premium && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-primary">PRO</span>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {locked ? "🔒 Unlock with Pro" : `Level ${p.level} · ⭐ ${p.xp} XP`}
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(p.cleared * 10, 100)}%`, background: "var(--gradient-fun)" }} />
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          📰 Current Affairs questions are written fresh each time from recent, verified events — never invented. The period they cover is shown on every quiz.
        </p>
      </div>
    );
  }

  /* ── Level map ──────────────────────────────────────────────── */
  if (!questions.length && !result) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{subject.emoji} {subject.title}</h2>
            <p className="text-sm text-muted-foreground">
              10 questions per level · ⭐ {prog?.xp ?? 0} XP · 🏆 {prog?.cleared ?? 0} levels cleared · best accuracy {prog?.bestAccuracy ?? 0}%
            </p>
          </div>
          <button onClick={() => setSubject(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">← All subjects</button>
        </div>

        {error && <p className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p>}
        {loading && <p className="mt-4 text-sm font-semibold text-muted-foreground">✨ Writing 10 fresh questions for level {level}…</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {mapLevels.map((lvl) => {
            const isLocked = lvl > unlocked;
            const done = (prog?.cleared ?? 0) >= lvl;
            return (
              <div key={lvl} className="flex items-center gap-3">
                <button
                  disabled={isLocked || loading}
                  onClick={() => startLevel(subject, lvl)}
                  className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 text-xs font-black transition ${
                    isLocked ? "cursor-not-allowed border-dashed border-border text-muted-foreground"
                      : done ? "border-primary bg-accent text-primary"
                      : "border-primary text-primary-foreground"
                  }`}
                  style={!isLocked && !done ? { background: "var(--gradient-fun)"} : undefined}
                >
                  <span className="text-xl" aria-hidden="true">{isLocked ? "🔒" : done ? "🏆" : "▶"}</span>
                  <span className="mt-1">Level {lvl}</span>
                  <span className="text-[10px] font-bold opacity-80">💰 {rewardForLevel(lvl)}</span>
                </button>
                {lvl !== mapLevels[mapLevels.length - 1] && <span className="text-muted-foreground" aria-hidden="true">→</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Celebration ────────────────────────────────────────────── */
  if (result) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
        <div className="animate-[foco-pop_0.6s_ease-out] text-6xl" aria-hidden="true">{result.passed ? "🏆" : "💪"}</div>
        <h2 className="mt-3 text-3xl font-black">{result.passed ? `Level ${level} complete!` : "Almost there!"}</h2>
        <div className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3 text-left sm:grid-cols-4">
          <Stat label="Score" value={`${result.score}/100`} />
          <Stat label="Accuracy" value={`${result.accuracy}%`} />
          <Stat label="XP" value={`⭐ ${result.xp}`} />
          <Stat label={CURRENCY} value={`💰 ${result.focalera}`} />
        </div>
        {result.accuracy >= 80 && result.passed && (
          <p className="mt-3 text-sm font-bold text-primary">🎉 High-accuracy bonus: +{accuracyBonus(result.accuracy)} {CURRENCY}</p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {result.passed ? `🔓 Level ${level + 1} unlocked · next reward 💰 ${rewardForLevel(level + 1)} + ⭐ ${xpForLevel(level + 1)} XP` : "Score 60% or more to unlock the next level."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {result.passed && (
            <button onClick={() => startLevel(subject, level + 1)} className="rounded-full px-6 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
              Start level {level + 1} →
            </button>
          )}
          <button onClick={() => startLevel(subject, level)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Replay level {level}</button>
          <button onClick={backToMap} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Level map</button>
        </div>
      </div>
    );
  }

  /* ── Playing ────────────────────────────────────────────────── */
  if (!current) return null;
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
        <span>{subject.emoji} {subject.title} · Level {level}</span>
        <span>Question {index + 1}/{questions.length} · ✅ {correctCount} · 🔥 {data.quizStreak}</span>
      </div>
      {subject.currentAffairs && period && (
        <p className="mt-1 text-xs font-semibold text-primary">📰 Based on events up to {period}</p>
      )}
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${(index / questions.length) * 100}%`, background: "var(--gradient-fun)" }} />
      </div>

      <p className="mt-4 text-lg font-bold">{current.q}</p>

      {(current.type === "mcq" || current.type === "truefalse") && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {current.options.map((o, i) => {
            const isAnswer = i === Number(current.answer);
            const state = !reveal ? "idle" : isAnswer ? "right" : reveal.text === o ? "wrong" : "idle";
            return (
              <button key={o + i} disabled={Boolean(reveal)}
                onClick={() => submit({ correct: isAnswer, text: o })}
                className={`rounded-2xl border p-3 text-left text-sm font-semibold transition ${
                  state === "right" ? "border-primary bg-accent"
                    : state === "wrong" ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border hover:bg-muted"
                }`}>
                {o}
              </button>
            );
          })}
        </div>
      )}

      {current.type === "blank" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={Boolean(reveal)}
            placeholder="Type your answer"
            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          <button disabled={Boolean(reveal) || !typed.trim()}
            onClick={() => submit({
              correct: typed.trim().toLowerCase() === String(current.answer).trim().toLowerCase(),
              text: typed.trim(),
            })}
            className="rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-fun)" }}>
            Check
          </button>
        </div>
      )}

      {current.type === "match" && (
        <div className="mt-3 space-y-2">
          {current.pairs.map((p, i) => (
            <div key={p.left + i} className="flex flex-wrap items-center gap-2">
              <span className="min-w-32 rounded-xl border border-border px-3 py-2 text-sm font-bold">{p.left}</span>
              <span aria-hidden="true">→</span>
              <select disabled={Boolean(reveal)} value={matched[i] ?? ""} onChange={(e) => setMatched((m) => ({ ...m, [i]: e.target.value }))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold">
                <option value="">Choose…</option>
                {[...current.pairs].map((o) => o.right).sort().map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
          <button disabled={Boolean(reveal) || Object.keys(matched).length < current.pairs.length}
            onClick={() => submit({
              correct: current.pairs.every((p, i) => matched[i] === p.right),
              text: "match",
            })}
            className="mt-1 rounded-2xl px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50" style={{ background: "var(--gradient-fun)" }}>
            Check matches
          </button>
        </div>
      )}

      {reveal && (
        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-sm font-bold">{reveal.correct ? "✅ Correct!" : "❌ Not quite."}</p>
          {!reveal.correct && (
            <p className="mt-1 text-sm text-muted-foreground">
              Answer: {current.type === "match"
                ? current.pairs.map((p) => `${p.left} → ${p.right}`).join(", ")
                : current.type === "blank"
                  ? String(current.answer)
                  : current.options[Number(current.answer)]}
            </p>
          )}
          {current.explain && <p className="mt-1 text-sm text-muted-foreground">💡 {current.explain}</p>}
          <button onClick={next} className="mt-3 rounded-full px-6 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
            {index + 1 >= questions.length ? "See results 🎉" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}

function Header({ totalXp, streak, owner }: { totalXp: number; streak: number; owner?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black tracking-tight">🗺️ Quiz Journey</h2>
        <p className="text-sm text-muted-foreground">
          Pick a subject, clear level 1, and the next level unlocks — forever. Fresh questions every time.
        </p>
      </div>
      <div className="flex gap-2 text-xs font-bold">
        <span className="rounded-full bg-muted px-3 py-1.5">⭐ {owner ? "∞" : totalXp} XP</span>
        <span className="rounded-full bg-muted px-3 py-1.5">🔥 {owner ? "∞" : streak} quiz streak</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}
