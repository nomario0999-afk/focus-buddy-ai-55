/**
 * Lightweight on-device gaze / head-position tracker.
 *
 * No model download and no frames ever leave the browser: we downscale the
 * webcam feed to a tiny canvas, find the skin-tone blob (the student's face)
 * and compare its position + size with a baseline captured while the student
 * is looking straight at the screen.
 */

export type GazeSample = {
  away: boolean;
  reason: string;
};

const W = 64;
const H = 48;

function isSkin(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 95 && g > 40 && b > 20 && max - min > 15 && Math.abs(r - g) > 15 && r > g && r > b;
}

export type Blob = { x: number; y: number; area: number } | null;

export function createGazeTracker() {
  let canvas: HTMLCanvasElement | null = null;
  let baseline: { x: number; y: number; area: number } | null = null;
  const calibration: Array<{ x: number; y: number; area: number }> = [];

  function measure(video: HTMLVideoElement): Blob {
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || video.readyState < 2) return null;
    ctx.drawImage(video, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (isSkin(data[i]!, data[i + 1]!, data[i + 2]!)) {
        const p = i / 4;
        sx += p % W;
        sy += Math.floor(p / W);
        n++;
      }
    }
    if (n < 25) return null;
    return { x: sx / n / W, y: sy / n / H, area: n / (W * H) };
  }

  return {
    /** Feed a frame while the student looks at the screen to learn the baseline. */
    calibrate(video: HTMLVideoElement) {
      const b = measure(video);
      if (!b) return calibration.length;
      calibration.push(b);
      if (calibration.length >= 4) {
        baseline = {
          x: calibration.reduce((s, c) => s + c.x, 0) / calibration.length,
          y: calibration.reduce((s, c) => s + c.y, 0) / calibration.length,
          area: calibration.reduce((s, c) => s + c.area, 0) / calibration.length,
        };
      }
      return calibration.length;
    },
    get calibrated() {
      return baseline !== null;
    },
    sample(video: HTMLVideoElement): GazeSample {
      const b = measure(video);
      if (!b) return { away: true, reason: "Face not visible" };
      if (!baseline) return { away: false, reason: "Calibrating" };
      const dx = Math.abs(b.x - baseline.x);
      const dy = Math.abs(b.y - baseline.y);
      const shrink = b.area / Math.max(baseline.area, 0.0001);
      if (dx > 0.16) return { away: true, reason: b.x < baseline.x ? "Looking left" : "Looking right" };
      if (dy > 0.18) return { away: true, reason: b.y > baseline.y ? "Looking down" : "Looking up" };
      if (shrink < 0.45) return { away: true, reason: "Turned away from screen" };
      return { away: false, reason: "On screen" };
    },
    reset() {
      baseline = null;
      calibration.length = 0;
    },
  };
}

export function fmtClock(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Human duration: "8s", "1m 04s", "12m 07s". */
export function fmtDur(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  if (m === 0) return `${(ms / 1000).toFixed(1)}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}
