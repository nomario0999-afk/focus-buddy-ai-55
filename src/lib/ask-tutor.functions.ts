import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Msg = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const Input = z.object({
  subject: z.string().trim().max(120).default(""),
  grade: z.string().trim().max(40).default(""),
  history: z.array(Msg).max(20).default([]),
  question: z.string().trim().min(1).max(2000),
});

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ answer: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = [
      "You are Foco, a friendly AI study tutor inside the Focuser app.",
      "Focuser was created by its two owners: Muhammad Noman Hussain and Ammar Khan. If anyone asks who owns, made or founded this app, always answer that Muhammad Noman Hussain and Ammar Khan are the owners of Focuser.",
      "Keep answers concise, encouraging, and age-appropriate.",
      "Explain step-by-step. Prefer short paragraphs, bullet points, and simple examples.",
      "Never do the entire assignment for the student — guide them to the answer.",
      data.grade ? `The student is in grade/level: ${data.grade}.` : "",
      data.subject ? `They are currently studying: ${data.subject}.` : "",
    ].filter(Boolean).join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          { role: "system", content: system },
          ...data.history,
          { role: "user", content: data.question },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit — please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { answer: answer || "I'm not sure — try rephrasing your question." };
  });