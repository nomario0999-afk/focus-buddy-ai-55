import { fmtDur } from "@/lib/gaze-tracker";
import { useCallback, useEffect, useRef, useState } from "react";

export type Flag = {
  id: string;
  start: number;
  end: number;
  reason: string;
};

export type StudentState = {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
  status: "ok" | "away" | "no-camera";
  reason: string;
  flags: Flag[];
  snapshot?: string;
};

export type ExamSession = {
  code: string;
  title: string;
  teacher: string;
  createdAt: number;
  active: boolean;
  students: Record<string, StudentState>;
};

const KEY = "focuser.exam.sessions";
const CH = "focuser-proctor";

type Store = Record<string, ExamSession>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Store) : {};
    return s && typeof s === "object" ? s : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function makeCode() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join("");
}

/** Shared live view over the exam sessions in this browser. */
export function useClassroom() {
  const [store, setStore] = useState<Store>({});
  const chan = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    setStore(read());
    const bc = "BroadcastChannel" in window ? new BroadcastChannel(CH) : null;
    chan.current = bc;
    const refresh = () => setStore(read());
    bc?.addEventListener("message", refresh);
    window.addEventListener("storage", refresh);
    const t = setInterval(refresh, 1500);
    return () => {
      bc?.removeEventListener("message", refresh);
      bc?.close();
      window.removeEventListener("storage", refresh);
      clearInterval(t);
    };
  }, []);

  const mutate = useCallback((fn: (s: Store) => void) => {
    const next = read();
    fn(next);
    write(next);
    setStore(next);
    chan.current?.postMessage("update");
  }, []);

  return { sessions: store, mutate };
}

export function summarizeCsv(session: ExamSession) {
  const rows = [["Student", "Away start", "Away end", "Duration (s)", "Duration", "Reason"]];
  for (const s of Object.values(session.students)) {
    if (s.flags.length === 0) rows.push([s.name, "—", "—", "0", "No flags"]);
    for (const f of s.flags) {
      rows.push([
        s.name,
        new Date(f.start).toLocaleTimeString(),
        new Date(f.end).toLocaleTimeString(),
        ((f.end - f.start) / 1000).toFixed(1),
        fmtDur(f.end - f.start),
        f.reason,
      ]);
    }
  }
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
}
