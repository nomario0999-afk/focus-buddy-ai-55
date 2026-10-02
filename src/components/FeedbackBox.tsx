import { useState } from "react";
import { track } from "@/lib/track";

export default function FeedbackBox({ name }: { name: string }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="rounded-3xl border border-border bg-card p-5 text-left shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-black tracking-tight">📝 Send us feedback</h3>
      {sent ? (
        <p className="mt-2 text-sm text-muted-foreground">Thank you! The Focuser team will read it.</p>
      ) : (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            track("feedback", `f_${Date.now()}`, name, { text: text.trim().slice(0, 2000) }, 0);
            setSent(true);
          }}
        >
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000}
            placeholder="Ideas, problems, anything…"
            className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button className="rounded-full bg-secondary px-5 py-2 text-sm font-bold text-secondary-foreground">Send feedback</button>
        </form>
      )}
    </div>
  );
}
