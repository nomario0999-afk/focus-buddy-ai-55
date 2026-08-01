import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  subject: z.string().trim().max(120).default(""),
  grade: z.string().trim().max(40).default(""),
  minutes: z.number().min(0).max(600),
  checks: z.number().min(0).max(500).default(0),
  distractions: z.number().min(0).max(500).default(0),
  streak: z.number().min(0).max(10000).default(0),
  questions: z.array(z.string().max(500)).max(10).default([]),
});

export type SessionSummary = {
  summary: string;
  focusScore: number;
  tip: string;
};

export const summarizeSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<SessionSummary> => {
    const fallbackScore =
      data.checks > 0
        ? Math.max(0, Math.round(((data.checks - data.distractions) / data.checks) * 100))
        : 100;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        summary: `Completed a ${data.minutes}-minute focus session${data.subject ? ` on ${data.subject}` : ""}.`,
        focusScore: fallbackScore,
        tip: "Keep your next session distraction-free to grow your streak.",
      };
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You write short, encouraging study-session recaps for a student app. Respond ONLY with strict JSON: {\"summary\": string under 220 chars, \"focusScore\": integer 0-100, \"tip\": short actionable tip under 120 chars}.",
          },
          {
            role: "user",
            content: JSON.stringify({
              grade: data.grade,
              subject: data.subject,
              minutes: data.minutes,
              focusChecks: data.checks,
              timesDistracted: data.distractions,
              streak: data.streak,
              questionsAsked: data.questions,
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return {
        summary: `Completed a ${data.minutes}-minute focus session${data.subject ? ` on ${data.subject}` : ""}.`,
        focusScore: fallbackScore,
        tip: "Keep your next session distraction-free to grow your streak.",
      };
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let parsed: Partial<SessionSummary> = {};
    try {
      parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    } catch {
      parsed = {};
    }
    return {
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim()
          ? parsed.summary.trim()
          : `Completed a ${data.minutes}-minute focus session${data.subject ? ` on ${data.subject}` : ""}.`,
      focusScore:
        typeof parsed.focusScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.focusScore))) : fallbackScore,
      tip: typeof parsed.tip === "string" ? parsed.tip : "Keep your next session distraction-free.",
    };
  });
