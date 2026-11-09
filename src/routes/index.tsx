import { createGazeTracker } from "@/lib/gaze-tracker";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import focoMascot from "@/assets/foco-mascot.png";
import { checkFocus } from "@/lib/focus-check.functions";
import { askTutor } from "@/lib/ask-tutor.functions";
import { summarizeSession } from "@/lib/session-summary.functions";
import ProfileHub from "@/components/ProfileHub";
import ConsentGate from "@/components/ConsentGate";
import CreditsPanel from "@/components/CreditsPanel";
import FeedbackBox from "@/components/FeedbackBox";
import GkChallenges from "@/components/GkChallenges";
import QuizJourney from "@/components/QuizJourney";
import { fmtAmount, isOwnerName } from "@/lib/owners";
import { useGameUnlocks } from "@/lib/game-unlocks";
import ExpandableCards, { type CardItem } from "@/components/ExpandableCards";
import {
  useProfiles, resolvedTheme, loadHistory, saveHistoryList,
  STREAK_BONUS_CREDITS, hashPassword,
  type HistoryEntry,
} from "@/lib/profiles";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({ meta: [
    { title: "Focuser — Focus Timer & AI Study Quizzes" },
    { name: "description", content: "Study with Foco using a focus timer, AI tutor, progressive quizzes and personal streaks." },
    { property: "og:title", content: "Focuser — Focus Timer & AI Study Quizzes" },
    { property: "og:description", content: "Your focus timer, AI study companion, quizzes and streaks in one place." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const MODE_LABEL: Record<Mode, string> = { focus: "Focus", short: "Short Break", long: "Long Break" };

const FEATURES: CardItem[] = [
  {
    icon: "🧠", title: "AI Focus Coaching", desc: "Personalized nudges to help you stay on track.", tint: "oklch(0.94 0.05 250)",
    points: [
      "Foco watches your webcam every 20 seconds during a focus session.",
      "Pauses the timer and speaks a friendly warning the moment you drift off.",
      "Escalates to a final warning, then ends the session and resets your streak.",
      "Personalised nudges tuned to your age, grade and subject.",
    ],
  },
  {
    icon: "⏱️", title: "Smart Pomodoro", desc: "Guided focus and break cycles that actually work.", tint: "oklch(0.94 0.06 55)",
    points: [
      "25-minute focus blocks with 5-minute short and 15-minute long breaks.",
      "Camera must be on to start — no accidental fake sessions.",
      "Live progress ring, session counter and 🔥 streak tracker.",
      "Auto-pauses if your camera turns off mid-session.",
    ],
  },
  {
    icon: "📚", title: "AI Study Planner", desc: "A study plan built around your goals and schedule.", tint: "oklch(0.94 0.06 155)",
    points: [
      "Tell Foco your grade and subject once — every answer adapts to it.",
      "Each session ends with a tip on what to study next.",
      "Break big topics into focus blocks you can finish today.",
    ],
  },
  {
    icon: "📈", title: "Progress Tracking", desc: "See streaks, focus minutes, and topics mastered.", tint: "oklch(0.94 0.05 290)",
    points: [
      "Every finished session is saved to your profile's history.",
      "AI focus score from 0–100% based on real distraction checks.",
      "History, streaks and Focolara are separate for each person on the device.",
    ],
  },
  {
    icon: "🏅", title: "Rewards & Badges", desc: "Unlock achievements for every milestone.", tint: "oklch(0.95 0.05 85)",
    points: [
      `Earn ${STREAK_BONUS_CREDITS} Focolara every time your streak grows.`,
      "Beat your best streak and keep the 🔥 alive.",
      "Win a mini-game in the arcade for +70 Focolara.",
    ],
  },
  {
    icon: "🤖", title: "AI Homework Helper", desc: "Step-by-step explanations, not just answers.", tint: "oklch(0.94 0.05 220)",
    points: [
      "Ask anything about your subject — Foco explains step by step.",
      "Answers are written for your grade level, never above your head.",
      "Guides you to the answer instead of doing the homework for you.",
      "Costs 1 Focolara per question.",
    ],
  },
];

const AUDIENCES: CardItem[] = [
  {
    icon: "👨‍🎓", title: "Students", desc: "Beat distractions and understand more.", tint: "oklch(0.94 0.05 250)",
    points: [
      "AI focus coach keeps you honest during study time.",
      "Homework helper explains anything at your grade level.",
      "Maths mini-games for a quick brain break between sessions.",
      "Streaks, Focolara and badges make studying feel like a game.",
    ],
  },
  {
    icon: "👨‍👩‍👧", title: "Parents", desc: "Real progress insights, no guesswork.", tint: "oklch(0.95 0.05 85)",
    points: [
      "A separate profile for every child on the same device.",
      "Session history with focus scores and AI recaps.",
      "Clear privacy controls — camera and AI can be switched off any time.",
      "Kid-friendly theme with bigger text and playful colours.",
    ],
  },
  {
    icon: "👩‍🏫", title: "Teachers", desc: "Track class progress and save prep time.", tint: "oklch(0.94 0.06 155)",
    points: [
      "Switch between student profiles in one tap.",
      "Focus scores show who really stayed on task.",
      "Ready-made maths practice through Portal Racer.",
      "Works offline as an installable app on any phone or tablet.",
    ],
  },
];

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

function Index() {
  const [mode, setMode] = useState<Mode>("focus");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const dur = (m: Mode) => (m === "focus" ? focusMinutes * 60 : DURATIONS[m]);
  const [secondsLeft, setSecondsLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  // ── Profiles (multi-user), credits, consent, themes ──
  const { profiles, active: profile, ready: profilesReady, setActiveId, addProfile, updateProfile, patchActive, removeProfile } = useProfiles();
  const streak = profile?.streak ?? 0;
  const credits = profile?.credits ?? 0;
  const bumpStreak = useCallback(() => {
    if (!profile) return;
    patchActive({
      streak: profile.streak + 1,
      bestStreak: Math.max(profile.bestStreak, profile.streak + 1),
      credits: profile.credits + STREAK_BONUS_CREDITS,
    });
  }, [profile, patchActive]);

  const resetStreak = useCallback(() => { patchActive({ streak: 0 }); }, [patchActive]);
  const addCredits = useCallback((n: number) => {
    if (!profile) return;
    patchActive({ credits: Math.max(0, profile.credits + n) });
  }, [profile, patchActive]);

  const gameLock = useGameUnlocks(profile?.id ?? null, streak, credits, addCredits);

  // Apply the age-based (or chosen) theme to the document
  useEffect(() => {
    const el = document.documentElement;
    const theme = resolvedTheme(profile);
    el.classList.remove("theme-kids", "theme-teen", "theme-adult", "theme-elder");
    el.classList.add(`theme-${theme}`);
  }, [profile]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Webcam / focus monitoring
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(true);
  const [lastCheck, setLastCheck] = useState<{
    focused: boolean;
    reason: string;
    at: number;
  } | null>(null);
  const [warningLevel, setWarningLevel] = useState(0); // 0 ok, 1 warn, 2 final, 3 streak lost
  const [isChecking, setIsChecking] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runCheck = useServerFn(checkFocus);
  const runAsk = useServerFn(askTutor);
  const runSummarize = useServerFn(summarizeSession);

  // Progress history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summarizing, setSummarizing] = useState(false);
  const checksRef = useRef(0);
  const distractionsRef = useRef(0);
  const summarizedRef = useRef(false);
  const framesRef = useRef<string[]>([]);
  const [recordEnabled, setRecordEnabled] = useState(false);

  // Study context + tutor chat
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  // Voice input (Web Speech API)
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  // Wake word: say "Foco" and he answers, like Siri.
  const [wakeOn, setWakeOn] = useState(false);
  const [wakeSupported, setWakeSupported] = useState(false);
  const wakeRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const wakeOnRef = useRef(false);
  const handleWakeRef = useRef<() => void>(() => {});
  const [wakeHeard, setWakeHeard] = useState("");
  const [wakeError, setWakeError] = useState("");
  const lastWakeAt = useRef(0);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => never; webkitSpeechRecognition?: new () => never };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setMicSupported(true);
    const rec = new Ctor() as unknown as {
      lang: string; interimResults: boolean; continuous: boolean;
      start: () => void; stop: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onend: (() => void) | null;
      onerror: ((e: { error?: string }) => void) | null;
    };
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setQuestion((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()).slice(0, 2000));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch { /* ignore */ } };
  }, []);

  const toggleMic = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) { try { rec.stop(); } catch { /* ignore */ } setListening(false); return; }
    try { rec.start(); setListening(true); } catch { setListening(false); }
  }, [listening]);

  // Continuous listener for the wake word "Foco" (and common mishearings).
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => never; webkitSpeechRecognition?: new () => never };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setWakeSupported(true);
    const rec = new Ctor() as unknown as {
      lang: string; interimResults: boolean; continuous: boolean;
      start: () => void; stop: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
      onend: (() => void) | null;
      onerror: (() => void) | null;
    };
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.toLowerCase();
        setWakeHeard(t);
        if (/(fo+ ?c|fo+ ?k|fu ?k|phok|phoc|photo|poco|poko|coco|focus|folk|fork|four ?co|for ?co|faux ?co)/.test(t)) {
          if (Date.now() - lastWakeAt.current < 4000) break;
          lastWakeAt.current = Date.now();
          handleWakeRef.current();
          break;
        }
      }
    };
    rec.onend = () => {
      // Browsers stop continuous recognition after a while; restart while enabled.
      if (wakeOnRef.current) setTimeout(() => { if (wakeOnRef.current) { try { rec.start(); } catch { /* ignore */ } } }, 300);
    };
    rec.onerror = (e) => {
      const err = e?.error ?? "";
      if (err === "not-allowed" || err === "service-not-allowed") {
        setWakeError("Microphone is blocked. Allow the microphone for this site, then turn it on again.");
        wakeOnRef.current = false; setWakeOn(false);
      } else if (err === "audio-capture") {
        setWakeError("No microphone found.");
        wakeOnRef.current = false; setWakeOn(false);
      }
    };
    wakeRef.current = rec;
    return () => { wakeOnRef.current = false; try { rec.stop(); } catch { /* ignore */ } wakeRef.current = null; };
  }, []);

  useEffect(() => {
    wakeOnRef.current = wakeOn;
    const rec = wakeRef.current;
    if (!rec) return;
    if (wakeOn) {
      setWakeError(""); setWakeHeard("");
      // Ask for mic permission first so the browser shows the prompt.
      navigator.mediaDevices?.getUserMedia?.({ audio: true })
        .then((st) => { st.getTracks().forEach((t) => t.stop()); try { rec.start(); } catch { /* ignore */ } })
        .catch(() => { setWakeError("Microphone is blocked. Allow the microphone for this site, then try again."); setWakeOn(false); });
    }
    else { try { rec.stop(); } catch { /* ignore */ } }
  }, [wakeOn]);

  useEffect(() => {
    try {
      const g = localStorage.getItem("focuser.grade") ?? "";
      const s = localStorage.getItem("focuser.subject") ?? "";
      if (g) setGrade(g);
      if (s) setSubject(s);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("focuser.grade", grade); } catch { /* ignore */ } }, [grade]);
  useEffect(() => { try { localStorage.setItem("focuser.subject", subject); } catch { /* ignore */ } }, [subject]);

  const handleAsk = useCallback(async () => {
    const q = question.trim();
    if (!q || askLoading) return;
    // The tutor is only ever blocked by one thing: running out of Focolara.
    if (profile && profile.credits < 1) {
      setAskError("You're out of Focolara — earn more through quizzes or focus streaks, or wait for your monthly refill.");
      return;
    }
    setAskError(null);
    const nextHistory = [...chat, { role: "user" as const, content: q }];
    setChat(nextHistory);
    setQuestion("");
    setAskLoading(true);
    try {
      const res = await runAsk({ data: { subject, grade, history: chat, question: q } });
      setChat([...nextHistory, { role: "assistant", content: res.answer }]);
      if (profile) addCredits(-1);
    } catch (e) {
      setAskError(e instanceof Error ? e.message : "Something went wrong.");
      setChat(chat); // rollback the user message so they can retry
    } finally {
      setAskLoading(false);
    }
  }, [question, askLoading, chat, subject, grade, runAsk, profile, addCredits]);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> });
    };
    const installedHandler = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);
  const triggerInstall = useCallback(async () => {
    if (!installPrompt) {
      alert("To install Focuser on your phone:\n\n• Android (Chrome): tap the ⋮ menu → 'Install app' or 'Add to Home screen'.\n• iPhone (Safari): tap the Share button → 'Add to Home Screen'.");
      return;
    }
    const res = await installPrompt.prompt();
    if (res.outcome === "accepted") setInstallPrompt(null);
  }, [installPrompt]);

  // History is linked to the active profile
  useEffect(() => {
    setHistory(profile ? loadHistory(profile.id) : []);
  }, [profile?.id]);

  const saveHistory = useCallback((entry: HistoryEntry) => {
    if (!profile) return;
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      saveHistoryList(profile.id, next);
      return next;
    });
  }, [profile]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          if (mode === "focus") {
            setSessions((n) => n + 1);
            bumpStreak();
            setWarningLevel(0);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, mode, bumpStreak]);

  const switchMode = (m: Mode) => {
    setMode(m);
    setSecondsLeft(dur(m));
    setRunning(false);
    setWarningLevel(0);
    checksRef.current = 0;
    distractionsRef.current = 0;
    summarizedRef.current = false;
  };

  const handleStartToggle = () => {
    if (!running && mode === "focus" && !camOn) {
      setCamError("Enable your camera to start a focus session — Foco needs to see you.");
      return;
    }
    setRunning((r) => !r);
  };

  // Auto-pause the timer if the camera turns off during a focus session
  useEffect(() => {
    if (running && mode === "focus" && !camOn) {
      setRunning(false);
      setCamError("Camera is off — timer paused. Turn the camera back on to continue.");
    }
  }, [camOn, running, mode]);

  // Start / stop webcam
  const startCam = useCallback(async () => {
    setCamError(null);
    if (profile?.consent && !profile.consent.camera) {
      setCamError("Camera checks are turned off in your privacy settings. Enable them in ⚙️ Profile settings.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch (e) {
      setCamError(e instanceof Error ? e.message : "Camera unavailable");
      setCamOn(false);
    }
  }, [profile]);
  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);
  useEffect(() => () => stopCam(), [stopCam]);

  const speak = useCallback((text: string) => {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  }, []);

  // Wake word reply: Foco only talks before or after a session, never while you study.
  const questionInputRef = useRef<HTMLInputElement | null>(null);
  const handleWake = useCallback(() => {
    if (running) return; // silent during a focus session
    speak(`Yes? I'm here. Ask me anything about ${subject.trim() || "your subject"}.`);
    questionInputRef.current?.focus();
  }, [running, subject, speak]);
  useEffect(() => { handleWakeRef.current = handleWake; }, [handleWake]);

  const beep = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.start(); o.stop(ctx.currentTime + 0.65);
    } catch { /* ignore */ }
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    const w = 320, h = 240;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.6);
  }, []);

  const checkingRef = useRef(false);
  const doFocusCheck = useCallback(async () => {
    if (checkingRef.current) return;
    const img = captureFrame();
    if (!img) return;
    checkingRef.current = true;
    setIsChecking(true);
    if (recordEnabled) framesRef.current = [...framesRef.current, img].slice(-6);
    try {
      const result = await runCheck({ data: { imageDataUrl: img } });
      setLastCheck({ focused: result.focused, reason: result.reason, at: Date.now() });
      checksRef.current += 1;
      if (!result.focused) distractionsRef.current += 1;
      if (result.focused) {
        setWarningLevel((lvl) => {
          if (lvl === 1 || lvl === 2) { setRunning(true); }
          return 0;
        });
      } else {
        setWarningLevel((lvl) => {
          const next = Math.min(lvl + 1, 3);
          if (next === 1) {
            setRunning(false);
            beep();
          } else if (next === 2) {
            setRunning(false);
            beep();
          } else if (next === 3) {
            setRunning(false);
            setSecondsLeft(dur(mode));
            resetStreak();
            beep();
            speak("Streak reset. Try again when you're ready.");
          }
          return next;
        });
      }
    } catch (e) {
      console.warn("Focus check failed", e);
    } finally {
      checkingRef.current = false;
      setIsChecking(false);
    }
  }, [captureFrame, runCheck, beep, speak, mode, resetStreak, recordEnabled]);

  // Interval: run check every 20s while focused session is running and cam on
  // Keeps checking while paused by a warning, so the final warning and session end still happen.
  const watching = camOn && monitoring && mode === "focus" && (running || warningLevel === 1 || warningLevel === 2);
  const doCheckRef = useRef(doFocusCheck);
  doCheckRef.current = doFocusCheck;
  useEffect(() => {
    if (!watching) return;
    const first = setTimeout(() => { void doCheckRef.current(); }, 4000);
    checkTimerRef.current = setInterval(() => { void doCheckRef.current(); }, 10000);
    // Fast on-device check: if no face is visible (left the room), ask the AI right away.
    const tracker = createGazeTracker();
    let missing = 0;
    const quick = setInterval(() => {
      const v = videoRef.current;
      if (!v) return;
      missing = tracker.sample(v).reason === "Face not visible" ? missing + 1 : 0;
      if (missing >= 2) { missing = 0; void doCheckRef.current(); }
    }, 2000);
    return () => {
      clearTimeout(first);
      clearInterval(quick);
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [watching]);

  // Generate an AI study-session summary when a focus session completes
  const finishSession = useCallback(async () => {
    const minutes = focusMinutes;
    const checks = checksRef.current;
    const distractions = distractionsRef.current;
    const questions = chat.filter((m) => m.role === "user").slice(-5).map((m) => m.content);
    const fallbackScore = checks > 0 ? Math.max(0, Math.round(((checks - distractions) / checks) * 100)) : 100;
    setSummarizing(true);
    let result = {
      summary: `Completed a ${minutes}-minute focus session${subject.trim() ? ` on ${subject.trim()}` : ""}.`,
      focusScore: fallbackScore,
      tip: "Keep your next session distraction-free to grow your streak.",
    };
    try {
      result = await runSummarize({
        data: { subject, grade, minutes, checks, distractions, streak: streak + 1, questions },
      });
    } catch (e) {
      console.warn("Summary failed", e);
    } finally {
      setSummarizing(false);
    }
    saveHistory({
      id: `${Date.now()}`,
      at: Date.now(),
      minutes,
      subject: subject.trim(),
      grade: grade.trim(),
      summary: result.summary,
      focusScore: result.focusScore,
      tip: result.tip,
      distractions,
      frames: recordEnabled ? framesRef.current.slice(-4) : undefined,
    });
    checksRef.current = 0;
    distractionsRef.current = 0;
    framesRef.current = [];
  }, [chat, subject, grade, streak, runSummarize, saveHistory, recordEnabled, focusMinutes]);

  useEffect(() => {
    if (mode !== "focus") return;
    if (secondsLeft > 0) { summarizedRef.current = false; return; }
    if (summarizedRef.current) return;
    summarizedRef.current = true;
    void finishSession();
  }, [secondsLeft, mode, finishSession]);

  const progress = Math.max(0, 1 - secondsLeft / dur(mode));
  const circumference = 2 * Math.PI * 130;

  const warningTone =
    warningLevel === 0
      ? null
      : warningLevel === 1
      ? { title: "You seem distracted", body: "Foco paused the timer. Get back to your work to resume." }
      : warningLevel === 2
      ? { title: "Final warning", body: "Focus now, or Foco will end this session and reset your streak." }
      : { title: "Streak lost", body: "The session ended and your streak was reset to 0. Try again!" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">F</div>
          <span className="text-lg font-bold tracking-tight">Focuser</span>
          <span className="ml-2 hidden rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground sm:inline">✨ Powered by AI</span>
        </div>
        <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#for-who" className="hover:text-foreground">For</a>
          <a href="#timer" className="hover:text-foreground">Timer</a>
          <a href="#games" className="hover:text-foreground">Games</a>
          <a href="#account" className="hover:text-foreground">Account</a>
          <a href="#safety" className="hover:text-foreground">Safety</a>
        </nav>
        <a
          href="#account"
          className="rounded-full px-4 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
          style={{ background: "var(--gradient-fun)" }}
        >
          {profile ? `${profile.avatar} ${profile.name.split(" ")[0]} · 🪙 ${fmtAmount(credits)}` : "Create account"}
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-6 pt-8 pb-16 md:grid-cols-2 md:pt-16">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" /> Your AI Study Buddy
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-6xl">
            Focus.{" "}
            <span className="text-primary">Learn.</span>{" "}
            <span className="text-[var(--secondary)]">Grow.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            A smarter way to stay focused, build better study habits, and achieve your goals — with a little help from Foco.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#timer" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90">
              Start a focus session
            </a>
            <a href="#features" className="rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent">
              See features
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div><span className="text-2xl font-bold text-foreground">25m–24h</span> sessions</div>
            <div><span className="text-2xl font-bold text-foreground">6</span> smart tools</div>
            <div><span className="text-2xl font-bold text-foreground">100%</span> student-safe</div>
          </div>
        </div>
        <div className="relative flex justify-center">
          <div
            className="absolute inset-0 -z-10 rounded-full opacity-60 blur-3xl"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="absolute -top-2 right-2 z-10 max-w-[200px] animate-[foco-pop_3s_ease-in-out_infinite] rounded-2xl border border-border bg-card px-4 py-2 text-sm font-bold shadow-[var(--shadow-soft)]">
            Let's learn something new! ✨
            <span className="absolute -bottom-1 left-6 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
          </div>
          <img
            src={focoMascot}
            alt="Foco, the Focuser AI study mascot"
            width={520}
            height={520}
            className="w-72 animate-[foco-float_3.2s_ease-in-out_infinite] drop-shadow-[0_20px_40px_oklch(0.62_0.19_250/0.25)] md:w-96"
          />
        </div>
      </section>

      {/* Timer */}
      <section id="timer" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-6 space-y-6" id="account">
          <ProfileHub
            profiles={profiles}
            active={profile}
            onSwitch={setActiveId}
            onCreate={(v) => {
              const created = addProfile(v as never);
              const pw = (v as { password?: string }).password;
              if (pw) void hashPassword(pw, created.id).then((h) => updateProfile(created.id, { passwordHash: h }));
            }}
            onUpdate={updateProfile}
            onDelete={removeProfile}
          />
          {profile && <CreditsPanel profile={profile} />}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Focus Timer</h2>
              <p className="text-sm text-muted-foreground">Science-backed Pomodoro sessions to keep you locked in.</p>
            </div>
            <div className="flex gap-1 rounded-full bg-muted p-1">
              {(Object.keys(DURATIONS) as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          {mode === "focus" && (
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="font-semibold">Session length:</span>
              {[25, 45, 60, 120, 240, 480, 1440].map((m) => (
                <button key={m} disabled={running} onClick={() => { setFocusMinutes(m); setSecondsLeft(m * 60); }}
                  className={`rounded-full border px-3 py-1 font-semibold disabled:opacity-50 ${focusMinutes === m ? "border-primary bg-accent" : "border-border hover:bg-muted"}`}>
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
              <label className="flex items-center gap-1">
                <input type="number" min={25} max={1440} disabled={running} value={focusMinutes}
                  onChange={(e) => { const v = Math.min(1440, Math.max(25, Math.round(Number(e.target.value) || 25))); setFocusMinutes(v); setSecondsLeft(v * 60); }}
                  className="w-20 rounded-full border border-border bg-card px-3 py-1" /> min
              </label>
              <span className="w-full text-center text-xs text-muted-foreground">Minimum 25 minutes, maximum 24 hours.</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-6 py-6">
            <div className="relative flex h-72 w-72 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
                <circle cx="150" cy="150" r="130" strokeWidth="14" className="fill-none stroke-muted" />
                <circle
                  cx="150"
                  cy="150"
                  r="130"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                />
              </svg>
              <div className="text-center">
                <div className="text-6xl font-black tabular-nums tracking-tight">{formatTime(secondsLeft)}</div>
                <div className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground">{MODE_LABEL[mode]}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleStartToggle}
                className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
              >
                {running ? "Pause" : secondsLeft === 0 ? "Restart" : "Start"}
              </button>
              <button
                onClick={() => switchMode(mode)}
                className="rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground transition hover:bg-accent"
              >
                Reset
              </button>
              <div className="ml-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                🏆 {sessions} today
              </div>
              <div className="rounded-full bg-[oklch(0.95_0.06_55)] px-4 py-2 text-sm font-semibold text-[oklch(0.4_0.15_45)]">
                🔥 Streak {fmtAmount(streak)}
              </div>
            </div>

            {/* Webcam focus monitor */}
            <div className="mt-4 w-full rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-black">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    {!camOn && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
                        Camera off
                      </div>
                    )}
                    {isChecking && (
                      <div className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="min-w-[160px]">
                    <div className="text-sm font-bold">🤖 Foco is watching</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      AI checks your webcam every 20s during focus sessions and
                      pauses the timer if you're distracted.
                    </div>
                    {lastCheck && (
                      <div className={`mt-2 text-xs font-medium ${lastCheck.focused ? "text-[oklch(0.5_0.15_155)]" : "text-[oklch(0.55_0.2_30)]"}`}>
                        {lastCheck.focused ? "✅ Focused" : "⚠️ Not focused"}
                        {lastCheck.reason && <span className="text-muted-foreground"> — {lastCheck.reason}</span>}
                      </div>
                    )}
                    {camError && <div className="mt-2 text-xs text-destructive">{camError}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!camOn ? (
                    <button
                      onClick={startCam}
                      className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                    >
                      Enable camera
                    </button>
                  ) : (
                    <>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={monitoring}
                          onChange={(e) => setMonitoring(e.target.checked)}
                        />
                        AI monitoring
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={recordEnabled}
                          onChange={(e) => setRecordEnabled(e.target.checked)}
                        />
                        Record session snapshots
                      </label>
                      <button
                        onClick={stopCam}
                        className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent"
                      >
                        Stop camera
                      </button>
                    </>
                  )}
                </div>
              </div>

              {warningTone && (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-xl p-4 text-sm ${
                    warningLevel === 3
                      ? "bg-destructive/10 text-destructive"
                      : warningLevel === 2
                      ? "bg-[oklch(0.95_0.12_55)] text-[oklch(0.4_0.18_45)]"
                      : "bg-[oklch(0.96_0.08_85)] text-[oklch(0.4_0.15_75)]"
                  }`}
                >
                  <div className="text-xl">
                    {warningLevel === 3 ? "💔" : warningLevel === 2 ? "🚨" : "⚠️"}
                  </div>
                  <div>
                    <div className="font-bold">{warningTone.title}</div>
                    <div className="text-xs opacity-90">{warningTone.body}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Study context + AI tutor */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">📚 What are you studying?</h2>
              <p className="text-sm text-muted-foreground">Tell Foco your grade and subject, then ask any question.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Grade / Level</span>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value.slice(0, 40))}
                placeholder="e.g. Grade 8"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject / Topic</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 120))}
                placeholder="e.g. Algebra — solving linear equations"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>

          <div className="mt-6">
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-muted/40 p-4">
              {chat.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Ask Foco anything about {subject.trim() || "your subject"} — explanations, examples, or step-by-step help.
                </div>
              ) : (
                chat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-foreground border border-border"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))
              )}
              {askLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
                    Foco is thinking…
                  </div>
                </div>
              )}
            </div>

            {askError && <div className="mt-2 text-xs text-destructive">{askError}</div>}

            <form
              onSubmit={(e) => { e.preventDefault(); void handleAsk(); }}
              className="mt-3 flex gap-2"
            >
              <input
                ref={questionInputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 2000))}
                placeholder="Ask Foco a question…"
                disabled={askLoading}
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              <button
                type="button"
                onClick={toggleMic}
                title={micSupported ? "Speak your question" : "Voice input isn't supported in this browser"}
                disabled={!micSupported || askLoading}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                  listening ? "border-transparent text-primary-foreground" : "border-border hover:bg-muted"
                }`}
                style={listening ? { background: "var(--gradient-fun)" } : undefined}
              >
                {listening ? "● Listening" : "🎤"}
              </button>
              <button
                type="submit"
                disabled={askLoading || !question.trim()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90 disabled:opacity-50"
              >
                Ask
              </button>
            </form>

            <div className="mt-3 flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-2">
              <div>
                <div className="text-sm font-semibold">🗣️ Say "Foco" to wake him</div>
                <div className="text-xs text-muted-foreground">
                  {wakeSupported
                    ? "Like Siri — say \"Foco\" and he answers. He stays quiet while you study."
                    : "Voice wake-up isn't supported in this browser (try Chrome or Edge)."}
                </div>
                {wakeError && <div className="text-xs font-semibold text-destructive">{wakeError}</div>}
                {wakeOn && wakeHeard && <div className="text-xs text-muted-foreground">Heard: “{wakeHeard}”</div>}
                {wakeOn && running && <div className="text-xs text-muted-foreground">Quiet mode: Foco answers after your session.</div>}
              </div>
              <button
                type="button"
                onClick={() => setWakeOn((v) => !v)}
                disabled={!wakeSupported}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
                  wakeOn ? "text-primary-foreground" : "border border-border hover:bg-muted"
                }`}
                style={wakeOn ? { background: "var(--gradient-fun)" } : undefined}
              >
                {wakeOn ? "● Listening for \"Foco\"" : "Turn on"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      {/* Progress history */}
      <section id="progress" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">📈 Progress history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Every completed focus session gets an AI recap saved on this device.
              </p>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => {
                  setHistory([]);
                  try { localStorage.removeItem("focuser.history"); } catch { /* ignore */ }
                }}
                className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                Clear history
              </button>
            )}
          </div>

          {summarizing && (
            <div className="mt-4 rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Foco is writing your session summary…
            </div>
          )}

          {history.length === 0 && !summarizing ? (
            <div className="mt-6 rounded-2xl bg-muted/40 py-10 text-center text-sm text-muted-foreground">
              No sessions yet — finish a focus session to get your first summary.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {history.map((h) => (
                <div key={h.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {new Date(h.at).toLocaleString()}
                    </span>
                    <span>• {h.minutes} min</span>
                    {h.subject && <span>• {h.subject}</span>}
                    {h.grade && <span>• Grade {h.grade}</span>}
                    <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-foreground">
                      Focus {h.focusScore}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{h.summary}</p>
                  {h.tip && <p className="mt-1 text-xs text-muted-foreground">💡 {h.tip}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {h.distractions === 0 ? "No distractions detected" : `${h.distractions} distraction${h.distractions > 1 ? "s" : ""} detected`}
                  </p>
                  {h.frames && h.frames.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {h.frames.map((f, i) => (
                          <img key={i} src={f} alt={`Session snapshot ${i + 1}`} className="h-16 w-24 rounded-lg border border-border object-cover" />
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">🔒 Recording saved on this device only. Never uploaded.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mini games */}
      <section id="games" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="space-y-6">
          <QuizJourney
            profileId={profile?.id ?? null}
            grade={grade}
            subscribed={Boolean(profile?.subscribed)}
            owner={isOwnerName(profile?.name)}
            onWin={(c) => addCredits(c)}
          />
          <GkChallenges onWin={(c) => addCredits(c)} lock={gameLock} />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why students love Focuser</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Six focused tools that turn scattered study time into real progress. Tap any card to see everything it does.</p>
        <ExpandableCards items={FEATURES} />
      </section>

      {/* For who */}
      <section id="for-who" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Made for everyone</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Tap a card to see exactly what Focuser gives you.</p>
        <ExpandableCards items={AUDIENCES} columns={3} />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl p-10 text-center text-primary-foreground shadow-[var(--shadow-soft)]" style={{ background: "var(--gradient-primary)" }}>
          <h2 className="text-3xl font-black md:text-4xl">Start focusing today.</h2>
          <p className="mx-auto mt-2 max-w-md text-white/90">One app. Endless possibilities. Download Focuser free.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={triggerInstall}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-md hover:opacity-90"
            >
              {installed ? "✅ Installed" : "📱 Install on your phone"}
            </button>
            <a
              href="#timer"
              className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            >
              Try it in browser
            </a>
          </div>
          <div className="mx-auto mt-4 max-w-sm text-xs text-white/80">
            Focuser installs like a real app — Android (Chrome): menu → "Install app". iPhone (Safari): Share → "Add to Home Screen".
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
          <h2 className="text-2xl font-bold tracking-tight">🛡️ Is Focuser safe? Yes — here is exactly why</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Focuser is built to be risk-free for children, students and families. Nothing about you is sold, shared or made public.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["🔐 Password protected", "Every account has its own password. It is scrambled with SHA-256 on your device — the real password is never stored or sent anywhere."],
              ["📵 No accounts on the internet", "There is no server database of users. Your profile, streaks, Focolara and history live only in this browser."],
              ["🎥 Camera stays with you", "Session snapshots are optional, saved on this device only, and you can delete them any time with one tap."],
              ["🤖 AI sees only what it needs", "A focus check sends one small frame to the AI to answer 'focused or not', then it is discarded. Nothing is kept."],
              ["🙅 No ads, no tracking, no selling", "No advertising pixels, no analytics profiling, no data brokers. Ever."],
              ["🧹 One-tap delete", "Clear your history, turn off the camera, or delete the whole profile whenever you want — it is gone immediately."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-border bg-background p-4">
                <div className="text-sm font-bold">{t}</div>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Children should always ask a parent before turning the camera on. Parents can review every saved session in Progress history.
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Focuser</span>
          <span>Focus. Learn. Grow.</span>
          <a href="/owner" className="text-xs text-muted-foreground/60 hover:text-foreground">·</a>
        </div>
        {isOwnerName(profile?.name) && (
          <div className="mx-auto max-w-2xl px-6 pb-4">
            <a href="/owner" className="block rounded-3xl border border-border bg-card p-5 text-center font-bold shadow-[var(--shadow-card)] hover:bg-muted">👑 Owner inbox — feedback, people & sign-ins</a>
          </div>
        )}
        <div className="mx-auto max-w-2xl px-6 pb-6"><FeedbackBox name={profile?.name ?? ""} /></div>
        <div className="px-6 pb-8 text-center">
          <p
            className="text-base font-black tracking-tight text-transparent"
            style={{ background: "var(--gradient-fun)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
          >
            Created by Ammar and Noman
          </p>
        </div>
      </footer>

      {profilesReady && profile && !profile.consent && (
        <ConsentGate
          name={profile.name}
          onAccept={(c) => patchActive({ consent: c })}
        />
      )}
    </div>
  );
}
