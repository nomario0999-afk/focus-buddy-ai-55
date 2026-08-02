import { useState } from "react";
import type { Consent } from "@/lib/profiles";

export default function ConsentGate({
  name, onAccept,
}: {
  name: string;
  onAccept: (c: Consent) => void;
}) {
  const [camera, setCamera] = useState(true);
  const [ai, setAi] = useState(true);
  const [storage, setStorage] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-black tracking-tight">🔒 Privacy &amp; consent</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hi {name || "there"} — before you start, choose what Focuser is allowed to do. You can change this any time in Profile settings.
        </p>

        <div className="mt-4 space-y-2">
          {([
            [camera, setCamera, "📷 Camera focus checks", "Foco looks at webcam frames during focus sessions to see if you're studying. Frames are analysed and never saved."],
            [ai, setAi, "🤖 AI tutor & summaries", "Questions, grade, subject and session stats are sent to the AI to answer and write recaps."],
            [storage, setStorage, "💾 Save on this device", "Profiles, streaks, credits and history are stored only in this browser — never on a server."],
          ] as const).map(([val, set, label, hint]) => (
            <label key={label} className="flex items-start gap-3 rounded-2xl border border-border p-3">
              <input type="checkbox" className="mt-1" checked={val} onChange={(e) => set(e.target.checked)} />
              <span>
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Focuser never asks for an email or password and does not sell any data. Kids should ask a parent before turning the camera on.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => onAccept({ camera, ai, storage, acceptedAt: Date.now() })}
            className="rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
            style={{ background: "var(--gradient-fun)" }}
          >
            Save choices
          </button>
          <button
            onClick={() => onAccept({ camera: false, ai: false, storage: true, acceptedAt: Date.now() })}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            Only the basics
          </button>
        </div>
      </div>
    </div>
  );
}
