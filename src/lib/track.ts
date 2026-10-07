import { reportActivity } from "@/lib/owner-sync.functions";

const last = new Map<string, { sig: string; at: number }>();

/** Fire-and-forget: tells the owner board about activity. Never blocks the app. */
export function track(
  kind: "person" | "class" | "report" | "pro" | "request" | "feedback" | "signin",
  ref: string,
  name: string,
  data: Record<string, unknown> = {},
  minGapMs = 5000,
) {
  if (typeof window === "undefined") return;
  const key = `${kind}:${ref}`;
  const sig = JSON.stringify([name, data]);
  const prev = last.get(key);
  if (prev && (prev.sig === sig || Date.now() - prev.at < minGapMs)) return;
  last.set(key, { sig, at: Date.now() });
  reportActivity({ data: { kind, ref, name, data } }).catch(() => {});
}
