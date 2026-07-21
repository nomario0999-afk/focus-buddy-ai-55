import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageDataUrl: z.string().min(20),
});

export type FocusResult = {
  focused: boolean;
  confidence: number;
  reason: string;
};

export const checkFocus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<FocusResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content:
              "You are a study-focus monitor. Given a webcam photo of a student at their desk, decide if they appear to be studying/focusing. Focused = looking at their screen or book, working, reading, writing. NOT focused = looking away for long, on their phone, eyes closed/asleep, empty chair, chatting, eating, playing, distracted. Respond ONLY with strict JSON: {\"focused\": boolean, \"confidence\": number 0-1, \"reason\": short string under 80 chars}.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Is this student focusing on their studies right now?" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit — slow down checks.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<FocusResult> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { focused: true, confidence: 0, reason: "Could not parse" };
    }
    return {
      focused: Boolean(parsed.focused),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  });