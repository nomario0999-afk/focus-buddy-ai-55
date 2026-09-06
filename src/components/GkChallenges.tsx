import { useMemo, useState } from "react";
import { CURRENCY, GAME_WIN_CREDITS } from "@/lib/profiles";
import type { GameLock } from "@/lib/game-unlocks";
import { LockHeaderBar, LockTag } from "@/components/GameLockUI";
import { CATEGORIES, LEVEL_LABELS } from "@/lib/gk-questions";

export default function GkChallenges({ onWin, lock }: { onWin?: (credits: number) => void; lock?: GameLock }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState<string[]>([]);
  const [lockMsg, setLockMsg] = useState<string | null>(null);

  const challenge = useMemo(() => CATEGORIES.find((c) => c.id === openId) ?? null, [openId]);
  const questions = challenge?.levels[level] ?? [];
  const runId = challenge ? `${challenge.id}-l${level + 1}` : "";

  const start = (id: string, lvl: number) => {
    if (lock && !lock.isUnlocked(id)) {
      const err = lock.unlock(id);
      if (err) { setLockMsg(err); return; }
    }
    setLockMsg(null);
    setOpenId(id); setLevel(lvl); setIndex(0); setPicked(null); setScore(0); setDone(false);
  };

  const choose = (i: number) => {
    if (picked !== null || !challenge) return;
    setPicked(i);
    if (i === questions[index]!.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (!challenge) return;
    if (index + 1 >= questions.length) {
      setDone(true);
      const passed = score >= Math.ceil(questions.length * 0.6);
      // Reward once per category AND level, so replaying can't farm Focolara.
      if (passed && !rewarded.includes(runId)) {
        setRewarded((r) => [...r, runId]);
        onWin?.(GAME_WIN_CREDITS);
      }
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  };

  const levelsDone = (id: string) => LEVEL_LABELS.filter((_, i) => rewarded.includes(`${id}-l${i + 1}`)).length;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">🧠 GK Challenges</h2>
          <p className="text-sm text-muted-foreground">
            {CATEGORIES.length} topics × 3 levels — easy, medium and hard. Score 3/5 or more to earn +{GAME_WIN_CREDITS} {CURRENCY}
            {" "}(once per level).
          </p>
        </div>
        {challenge && (
          <button onClick={() => setOpenId(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            ← All challenges
          </button>
        )}
      </div>

      {lock && <LockHeaderBar lock={lock} />}
      {lockMsg && <p className="mt-2 text-sm font-semibold text-destructive">{lockMsg}</p>}

      {!challenge && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border p-4">
              <div className="text-3xl" aria-hidden="true">{c.emoji}</div>
              <div className="mt-2 text-sm font-bold">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.blurb}</div>
              <div className="mt-2 text-xs font-semibold text-primary">
                {lock
                  ? <LockTag lock={lock} id={c.id} wonLabel={`${levelsDone(c.id)}/3 levels cleared`} />
                  : `${levelsDone(c.id)}/3 levels cleared`}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {LEVEL_LABELS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => start(c.id, i)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition hover:bg-accent ${
                      rewarded.includes(`${c.id}-l${i + 1}`) ? "border-primary bg-accent" : "border-border"
                    }`}
                  >
                    {rewarded.includes(`${c.id}-l${i + 1}`) ? "✅ " : ""}L{i + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {challenge && !done && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{challenge.emoji} {challenge.title} · {LEVEL_LABELS[level]}</span>
            <span>Question {index + 1} / {questions.length} · Score {score}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-[width]"
              style={{ width: `${(index / questions.length) * 100}%`, background: "var(--gradient-fun)" }} />
          </div>

          <p className="mt-4 text-lg font-bold">{questions[index]!.q}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {questions[index]!.options.map((o, i) => {
              const isAnswer = i === questions[index]!.answer;
              const state = picked === null ? "idle" : isAnswer ? "right" : picked === i ? "wrong" : "idle";
              return (
                <button key={o} onClick={() => choose(i)} disabled={picked !== null}
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

          {picked !== null && (
            <button onClick={next} className="mt-4 rounded-full px-6 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
              style={{ background: "var(--gradient-fun)" }}>
              {index + 1 >= questions.length ? "See result 🎉" : "Next question →"}
            </button>
          )}
        </div>
      )}

      {challenge && done && (
        <div className="mt-5 rounded-2xl border border-border p-5 text-center">
          <div className="text-4xl" aria-hidden="true">{score >= 3 ? "🏆" : "💪"}</div>
          <p className="mt-2 text-xl font-black">You scored {score} / {questions.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score >= 3
              ? `${LEVEL_LABELS[level]} passed! ${rewarded.includes(runId) ? `+${GAME_WIN_CREDITS} ${CURRENCY} added.` : "Already claimed for this level."}`
              : "Try again to reach 3 correct and earn your reward."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => start(challenge.id, level)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Play again</button>
            {level + 1 < challenge.levels.length && (
              <button onClick={() => start(challenge.id, level + 1)} className="rounded-full px-5 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
                Next level →
              </button>
            )}
            <button onClick={() => setOpenId(null)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">
              More challenges
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
