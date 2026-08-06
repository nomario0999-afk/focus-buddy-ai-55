import { useMemo, useState } from "react";
import { CURRENCY, GAME_WIN_CREDITS } from "@/lib/profiles";

type Q = { q: string; options: string[]; answer: number };
type Challenge = { id: string; title: string; emoji: string; blurb: string; questions: Q[] };

const CHALLENGES: Challenge[] = [
  {
    id: "world",
    title: "World & Capitals",
    emoji: "🌍",
    blurb: "Countries, capitals and flags.",
    questions: [
      { q: "What is the capital of Japan?", options: ["Osaka", "Tokyo", "Kyoto", "Seoul"], answer: 1 },
      { q: "Which is the largest continent?", options: ["Africa", "Europe", "Asia", "Antarctica"], answer: 2 },
      { q: "The Nile river mainly flows through which continent?", options: ["Asia", "Africa", "Europe", "South America"], answer: 1 },
      { q: "Which country has the most people?", options: ["India", "USA", "Russia", "Brazil"], answer: 0 },
      { q: "Capital of Saudi Arabia?", options: ["Jeddah", "Mecca", "Riyadh", "Dammam"], answer: 2 },
    ],
  },
  {
    id: "science",
    title: "Science Sprint",
    emoji: "🔬",
    blurb: "Space, body and everyday science.",
    questions: [
      { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1 },
      { q: "What gas do plants take in to make food?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], answer: 2 },
      { q: "How many bones are in an adult human body?", options: ["206", "180", "300", "150"], answer: 0 },
      { q: "What is H2O commonly called?", options: ["Salt", "Water", "Sugar", "Acid"], answer: 1 },
      { q: "Which organ pumps blood?", options: ["Lungs", "Liver", "Heart", "Brain"], answer: 2 },
    ],
  },
  {
    id: "history",
    title: "History Heroes",
    emoji: "🏛️",
    blurb: "People and events that shaped the world.",
    questions: [
      { q: "Who was the first person on the Moon?", options: ["Yuri Gagarin", "Neil Armstrong", "Buzz Aldrin", "Michael Collins"], answer: 1 },
      { q: "The Great Pyramids are in which country?", options: ["Iraq", "Mexico", "Egypt", "Greece"], answer: 2 },
      { q: "In which year did World War II end?", options: ["1939", "1945", "1918", "1950"], answer: 1 },
      { q: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens", "Shakespeare", "Tolstoy", "Homer"], answer: 1 },
      { q: "The Great Wall is in which country?", options: ["China", "Japan", "India", "Korea"], answer: 0 },
    ],
  },
  {
    id: "sports",
    title: "Sports & Fun",
    emoji: "⚽",
    blurb: "Games, records and champions.",
    questions: [
      { q: "How many players are in a football (soccer) team on the pitch?", options: ["9", "10", "11", "12"], answer: 2 },
      { q: "How often are the Summer Olympics held?", options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 5 years"], answer: 2 },
      { q: "In cricket, how many balls are in one over?", options: ["4", "6", "8", "10"], answer: 1 },
      { q: "Which sport uses a shuttlecock?", options: ["Tennis", "Badminton", "Squash", "Hockey"], answer: 1 },
      { q: "What colour card sends a footballer off?", options: ["Yellow", "Blue", "Red", "Green"], answer: 2 },
    ],
  },
  {
    id: "nature",
    title: "Nature & Animals",
    emoji: "🦁",
    blurb: "Animals, plants and the planet.",
    questions: [
      { q: "Which is the largest animal on Earth?", options: ["Elephant", "Blue whale", "Giraffe", "Shark"], answer: 1 },
      { q: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: 1 },
      { q: "Which bird cannot fly?", options: ["Eagle", "Penguin", "Parrot", "Sparrow"], answer: 1 },
      { q: "What do bees make?", options: ["Milk", "Honey", "Silk", "Wax only"], answer: 1 },
      { q: "Which is the fastest land animal?", options: ["Lion", "Horse", "Cheetah", "Wolf"], answer: 2 },
    ],
  },
  {
    id: "words",
    title: "Words & Numbers",
    emoji: "🔤",
    blurb: "Language and quick brain teasers.",
    questions: [
      { q: "How many letters are in the English alphabet?", options: ["24", "25", "26", "27"], answer: 2 },
      { q: "What is the opposite of 'ancient'?", options: ["Old", "Modern", "Huge", "Quiet"], answer: 1 },
      { q: "Which one is a vowel?", options: ["B", "E", "K", "T"], answer: 1 },
      { q: "How many minutes are in two hours?", options: ["100", "110", "120", "140"], answer: 2 },
      { q: "What does 'GK' stand for?", options: ["Good Knowledge", "General Knowledge", "Great Kids", "Global Key"], answer: 1 },
    ],
  },
];

export default function GkChallenges({ onWin }: { onWin?: (credits: number) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [rewarded, setRewarded] = useState<string[]>([]);

  const challenge = useMemo(() => CHALLENGES.find((c) => c.id === openId) ?? null, [openId]);

  const start = (id: string) => {
    setOpenId(id); setIndex(0); setPicked(null); setScore(0); setDone(false);
  };

  const choose = (i: number) => {
    if (picked !== null || !challenge) return;
    setPicked(i);
    if (i === challenge.questions[index]!.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (!challenge) return;
    if (index + 1 >= challenge.questions.length) {
      setDone(true);
      const passed = score >= Math.ceil(challenge.questions.length * 0.6);
      // Reward only once per challenge, so re-pressing can't farm Focolara.
      if (passed && !rewarded.includes(challenge.id)) {
        setRewarded((r) => [...r, challenge.id]);
        onWin?.(GAME_WIN_CREDITS);
      }
      return;
    }
    setIndex((n) => n + 1);
    setPicked(null);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight">🧠 GK Challenges</h2>
          <p className="text-sm text-muted-foreground">
            General-knowledge quizzes — no maths, just brain power. Score 3/5 or more to earn +{GAME_WIN_CREDITS} {CURRENCY} (once per challenge).
          </p>
        </div>
        {challenge && (
          <button onClick={() => setOpenId(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
            ← All challenges
          </button>
        )}
      </div>

      {!challenge && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c) => (
            <button key={c.id} onClick={() => start(c.id)}
              className="rounded-2xl border border-border p-4 text-left transition hover:-translate-y-0.5 hover:bg-accent">
              <div className="text-3xl" aria-hidden="true">{c.emoji}</div>
              <div className="mt-2 text-sm font-bold">{c.title}</div>
              <div className="text-xs text-muted-foreground">{c.blurb}</div>
              <div className="mt-2 text-xs font-semibold text-primary">
                {rewarded.includes(c.id) ? "✅ Completed" : `5 questions · +${GAME_WIN_CREDITS} ${CURRENCY}`}
              </div>
            </button>
          ))}
        </div>
      )}

      {challenge && !done && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>{challenge.emoji} {challenge.title}</span>
            <span>Question {index + 1} / {challenge.questions.length} · Score {score}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-[width]"
              style={{ width: `${((index) / challenge.questions.length) * 100}%`, background: "var(--gradient-fun)" }} />
          </div>

          <p className="mt-4 text-lg font-bold">{challenge.questions[index]!.q}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {challenge.questions[index]!.options.map((o, i) => {
              const isAnswer = i === challenge.questions[index]!.answer;
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
              {index + 1 >= challenge.questions.length ? "See result 🎉" : "Next question →"}
            </button>
          )}
        </div>
      )}

      {challenge && done && (
        <div className="mt-5 rounded-2xl border border-border p-5 text-center">
          <div className="text-4xl" aria-hidden="true">{score >= 3 ? "🏆" : "💪"}</div>
          <p className="mt-2 text-xl font-black">You scored {score} / {challenge.questions.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {score >= 3
              ? `Challenge passed! ${rewarded.includes(challenge.id) ? `+${GAME_WIN_CREDITS} ${CURRENCY} added.` : "Already claimed for this challenge."}`
              : "Try again to reach 3 correct and earn your reward."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => start(challenge.id)} className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted">Play again</button>
            <button onClick={() => setOpenId(null)} className="rounded-full px-5 py-2 text-sm font-bold text-primary-foreground" style={{ background: "var(--gradient-fun)" }}>
              More challenges
            </button>
          </div>
        </div>
      )}
    </div>
  );
}