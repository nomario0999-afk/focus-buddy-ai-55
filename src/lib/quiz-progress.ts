import { useCallback, useEffect, useState } from "react";

export type SubjectDef = {
  id: string;
  title: string;
  emoji: string;
  premium?: boolean;
  currentAffairs?: boolean;
};

export const QUIZ_SUBJECTS: SubjectDef[] = [
  { id: "mathematics", title: "Mathematics", emoji: "➗" },
  { id: "science", title: "Science", emoji: "🔬" },
  { id: "english", title: "English", emoji: "📖" },
  { id: "geography", title: "Geography", emoji: "🗺️" },
  { id: "history", title: "History", emoji: "🏛️" },
  { id: "computer-science", title: "Computer Science", emoji: "💻" },
  { id: "general-knowledge", title: "General Knowledge", emoji: "🧠" },
  { id: "space", title: "Space", emoji: "🚀" },
  { id: "nature", title: "Nature", emoji: "🌿" },
  { id: "animals", title: "Animals", emoji: "🦁" },
  { id: "sports", title: "Sports", emoji: "⚽" },
  { id: "technology", title: "Technology", emoji: "🤖" },
  { id: "current-affairs", title: "Current Affairs", emoji: "📰", currentAffairs: true },
  { id: "ca-challenge", title: "Current Affairs Challenge", emoji: "🌍", currentAffairs: true, premium: true },
  { id: "olympiad", title: "Olympiad Challenge", emoji: "🥇", premium: true },
  { id: "exam-master", title: "Exam Master Levels", emoji: "🎓", premium: true },
];

export type SubjectProgress = {
  level: number;      // highest unlocked level
  xp: number;
  cleared: number;    // levels completed
  bestAccuracy: number;
  seen: string[];     // question texts already used
};

export type QuizProgress = {
  totalXp: number;
  quizStreak: number;
  subjects: Record<string, SubjectProgress>;
};

const empty = (): QuizProgress => ({ totalXp: 0, quizStreak: 0, subjects: {} });
const blank = (): SubjectProgress => ({ level: 1, xp: 0, cleared: 0, bestAccuracy: 0, seen: [] });
const key = (profileId: string | null) => `focuser.quizjourney.${profileId ?? "guest"}`;

/** Focalera reward grows with the level: 10, 15, 20, 25 … capped at 90. */
export function rewardForLevel(level: number) {
  return Math.min(10 + (level - 1) * 5, 90);
}
export function xpForLevel(level: number) {
  return 50 + (level - 1) * 20;
}
/** Bonus for high accuracy. */
export function accuracyBonus(accuracy: number) {
  if (accuracy >= 100) return 20;
  if (accuracy >= 90) return 12;
  if (accuracy >= 80) return 6;
  return 0;
}

export function useQuizProgress(profileId: string | null) {
  const [data, setData] = useState<QuizProgress>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    try {
      const raw = localStorage.getItem(key(profileId));
      const parsed = raw ? (JSON.parse(raw) as QuizProgress) : empty();
      setData(parsed && typeof parsed === "object" && parsed.subjects ? parsed : empty());
    } catch { setData(empty()); }
    setReady(true);
  }, [profileId]);

  const persist = useCallback((next: QuizProgress) => {
    setData(next);
    try { localStorage.setItem(key(profileId), JSON.stringify(next)); } catch { /* ignore */ }
  }, [profileId]);

  const forSubject = useCallback((id: string) => data.subjects[id] ?? blank(), [data]);

  /** Record a finished level; unlocks the next one when the student passes. */
  const complete = useCallback((subjectId: string, level: number, accuracy: number, seen: string[]) => {
    const cur = data.subjects[subjectId] ?? blank();
    const passed = accuracy >= 60;
    const xp = passed ? xpForLevel(level) : Math.round(xpForLevel(level) * 0.3);
    const next: QuizProgress = {
      totalXp: data.totalXp + xp,
      quizStreak: passed ? data.quizStreak + 1 : 0,
      subjects: {
        ...data.subjects,
        [subjectId]: {
          level: passed ? Math.max(cur.level, level + 1) : cur.level,
          xp: cur.xp + xp,
          cleared: passed ? Math.max(cur.cleared, level) : cur.cleared,
          bestAccuracy: Math.max(cur.bestAccuracy, accuracy),
          seen: [...cur.seen, ...seen].slice(-120),
        },
      },
    };
    persist(next);
    return { xp, passed, focalera: passed ? rewardForLevel(level) + accuracyBonus(accuracy) : 0 };
  }, [data, persist]);

  return { data, ready, forSubject, complete };
}
