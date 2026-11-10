import { useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import videoAsset from "@/assets/focuser-study-with-foco.mp4.asset.json";
import coverAsset from "@/assets/focuser-video-cover.jpg.asset.json";

export default function FocuserVideo() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(videoAsset.url);
      if (!response.ok) throw new Error("Download unavailable");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "Focuser-study-with-Foco.mp4";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage("Your download has started.");
    } catch {
      setMessage("Couldn't download the video. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    setMessage("");
    const url = `${window.location.origin}/#focuser-video`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Focuser — Study with Foco", text: "Watch Focuser's one-minute video and study with Foco.", url });
      } else {
        await navigator.clipboard.writeText(url);
        setMessage("Video page link copied — ready to share.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Couldn't share this time. Please try again.");
    }
  }

  return (
    <section id="focuser-video" aria-labelledby="focuser-video-title" className="mx-auto max-w-6xl scroll-mt-4 px-6 pb-8 pt-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-secondary">FOCUSER · 1 MINUTE</p>
          <h2 id="focuser-video-title" className="text-2xl font-bold">Study with Foco</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={share}><Share2 /> Share</Button>
          <Button variant="outline" disabled={busy} onClick={download}><Download /> {busy ? "Downloading…" : "Download"}</Button>
        </div>
      </div>
      <video aria-label="Focuser one-minute video" controls playsInline preload="none" poster={coverAsset.url} className="aspect-video w-full rounded-lg bg-muted" src={videoAsset.url} />
      <p role="status" className="mt-2 min-h-5 text-sm text-muted-foreground">{message}</p>
    </section>
  );
}