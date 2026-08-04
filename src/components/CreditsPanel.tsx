import {
  CURRENCY, GAME_WIN_CREDITS, MONTHLY_FREE_CREDITS, MONTHLY_PRO_CREDITS, STREAK_BONUS_CREDITS, SUBSCRIPTION_PRICE,
  type Profile,
} from "@/lib/profiles";

export default function CreditsPanel({
  profile, onSubscribe,
}: {
  profile: Profile;
  onSubscribe: () => void;
}) {
  const pct = Math.max(0, Math.min(100, (profile.credits / (profile.subscribed ? MONTHLY_PRO_CREDITS : MONTHLY_FREE_CREDITS)) * 100));
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🪙 Your {CURRENCY}</h2>
          <p className="text-sm text-muted-foreground">
            1 {CURRENCY} per question to Foco · +{STREAK_BONUS_CREDITS} for every streak · +{GAME_WIN_CREDITS} per game won.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black tabular-nums">{profile.credits.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{profile.subscribed ? "Pro plan" : "Free plan"}</div>
        </div>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, background: "var(--gradient-fun)" }} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-muted/50 p-3 text-sm">
          <div className="font-bold">Monthly refill</div>
          <div className="text-xs text-muted-foreground">
            {(profile.subscribed ? MONTHLY_PRO_CREDITS : MONTHLY_FREE_CREDITS).toLocaleString()} {CURRENCY} every month.
          </div>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 text-sm">
          <div className="font-bold">🔥 Streak bonus</div>
          <div className="text-xs text-muted-foreground">+{STREAK_BONUS_CREDITS} {CURRENCY} each time your streak grows (best: {profile.bestStreak}).</div>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 text-sm">
          <div className="font-bold">❓ Questions</div>
          <div className="text-xs text-muted-foreground">−1 {CURRENCY} per question to the AI tutor.</div>
        </div>
      </div>

      {profile.subscribed ? (
        <div className="mt-4 rounded-2xl border border-border p-4 text-sm">
          <span className="font-bold">✅ Focuser Pro active</span> — {MONTHLY_PRO_CREDITS.toLocaleString()} {CURRENCY} per month.
          <button onClick={onSubscribe} className="ml-3 text-xs font-semibold text-muted-foreground underline">Cancel</button>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-[2px]" style={{ background: "var(--gradient-fun)" }}>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl bg-card p-4">
            <div>
              <div className="text-sm font-black">Out of {CURRENCY}? Go Pro 🚀</div>
              <div className="text-xs text-muted-foreground">
                {SUBSCRIPTION_PRICE} / month → {MONTHLY_PRO_CREDITS.toLocaleString()} {CURRENCY} every month.
              </div>
            </div>
            <button onClick={onSubscribe} className="rounded-full px-5 py-2 text-sm font-bold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90" style={{ background: "var(--gradient-fun)" }}>
              Subscribe for {SUBSCRIPTION_PRICE}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
