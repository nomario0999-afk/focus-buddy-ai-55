import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** One question. `match` uses pairs; every other type uses options + answer index/text. */
const Shape = z.object({
  type: z.enum(["mcq", "truefalse", "blank", "match"]),
  q: z.string().min(1).max(400),
  options: z.array(z.string().max(160)).max(6).default([]),
  /** Index into options for mcq/truefalse, or the exact word for blank. */
  answer: z.union([z.number().int().min(0).max(5), z.string().max(80)]),
  pairs: z.array(z.object({ left: z.string().max(80), right: z.string().max(80) })).max(5).default([]),
  explain: z.string().max(300).default(""),
});

/** Models name the fields inconsistently, so accept the common aliases. */
export const QuizQuestion = z.preprocess((raw) => {
  if (typeof raw !== "object" || raw === null) return raw;
  const r = raw as Record<string, unknown>;
  const type = r['type'] ?? (Array.isArray(r['pairs']) && (r['pairs'] as unknown[]).length ? "match" : undefined);
  return {
    ...r,
    type: type ?? (Array.isArray(r['options']) && (r['options'] as unknown[]).length ? "mcq" : "blank"),
    q: r['q'] ?? r['question'] ?? r['text'] ?? r['prompt'] ?? "",
    answer: r['answer'] ?? r['correct'] ?? r['correctAnswer'] ?? r['answerIndex'] ?? 0,
    explain: r['explain'] ?? r['explanation'] ?? "",
    options: Array.isArray(r['options']) ? r['options'] : [],
    pairs: Array.isArray(r['pairs']) ? r['pairs'] : [],
  };
}, Shape);

export type QuizQuestion = z.infer<typeof QuizQuestion>;

const Input = z.object({
  subject: z.string().trim().min(1).max(60),
  level: z.number().int().min(1).max(500),
  currentAffairs: z.boolean().default(false),
  grade: z.string().trim().max(40).default(""),
  /** Question texts already seen, so the model avoids repeats. */
  seen: z.array(z.string().max(200)).max(60).default([]),
});

export type QuizResult = {
  questions: QuizQuestion[];
  /** Human readable period the current-affairs questions cover, e.g. "Aug–Sep 2026". */
  period: string;
  source: "ai" | "unavailable";
  note?: string;
};

function difficultyFor(level: number) {
  if (level <= 3) return "easy, for young students";
  if (level <= 7) return "easy to medium";
  if (level <= 12) return "medium";
  if (level <= 20) return "medium to hard";
  return "hard and challenging, but still school-appropriate";
}

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<QuizResult> => {
    const key = process.env['LOVABLE_API_KEY'];
    const now = new Date();
    const period = now.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

    if (!key) return { questions: [], period, source: "unavailable", note: "Quiz service is not configured." };

    const rules = [
      `Create exactly 10 quiz questions for the subject "${data.subject}".`,
      `This is level ${data.level} of an endless progression. Difficulty: ${difficultyFor(data.level)}.`,
      data.grade ? `The student is in grade/level ${data.grade}.` : "",
      "Mix question types: about 5 mcq, 2 truefalse, 2 blank (fill in the blank), 1 match.",
      "mcq: 4 options, 'answer' is the 0-based index of the correct option.",
      "truefalse: options MUST be [\"True\",\"False\"], 'answer' is 0 or 1.",
      "blank: use ____ inside the question text, 'answer' is the exact single word or short phrase, options must be [].",
      "match: provide 4 pairs in 'pairs', options must be [], answer must be 0.",
      "Everything must be safe, factual and age-appropriate for students. No violence, politics-bashing or adult content.",
      "Order the 10 questions easy first, hardest last.",
      data.seen.length ? `Do NOT repeat or rephrase any of these already-used questions: ${data.seen.slice(-40).join(" | ")}` : "",
      data.currentAffairs
        ? `These must be CURRENT AFFAIRS questions about verified real events from roughly the last 6 months up to ${period} (today is ${now.toISOString().slice(0, 10)}). Cover science & technology, space discoveries, sports, major world events, inventions, environment, education and geography. If you are not confident a fact is true and recent, use an older well-established verified fact instead of guessing. Never invent an event.`
        : "",
      "Return ONLY JSON: {\"period\":\"...\",\"questions\":[...]} with no markdown fence.",
    ].filter(Boolean).join("\n");

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "openai/gpt-5.5",
          messages: [
            { role: "system", content: "You are a careful school quiz writer. You output strict JSON only and never invent facts." },
            { role: "user", content: rules },
          ],
          response_format: { type: "json_object" },
        }),
      });
    } catch {
      return { questions: [], period, source: "unavailable", note: "Could not reach the quiz service." };
    }

    if (!res.ok) {
      console.error("[quiz] gateway", res.status, (await res.text().catch(() => "")).slice(0, 400));
      const note = res.status === 429
        ? "Too many quizzes at once — wait a few seconds and try again."
        : res.status === 402
          ? "AI credits are exhausted."
          : "Fresh questions are temporarily unavailable.";
      return { questions: [], period, source: "unavailable", note };
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim()) as {
        period?: string; questions?: unknown[];
      };
      const questions = z.array(QuizQuestion).parse(parsed.questions ?? []).slice(0, 10);
      if (questions.length < 4) throw new Error("too few");
      return { questions, period: data.currentAffairs && parsed.period ? parsed.period : period, source: "ai" };
    } catch (e) {
      console.error("[quiz] parse", String(e).slice(0, 300), raw.slice(0, 400));
      return { questions: [], period, source: "unavailable", note: "Fresh questions are temporarily unavailable." };
    }
  });
