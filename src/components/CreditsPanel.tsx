import {
  CURRENCY, GAME_WIN_CREDITS, MONTHLY_FREE_CREDITS, MONTHLY_PRO_CREDITS, STREAK_BONUS_CREDITS,
  type Profile,
} from "@/lib/profiles";
import { fmtAmount, isOwnerName } from "@/lib/owners";

export default function CreditsPanel({
  profile,
}: {
  profile: Profile;
}) {
  const owner = isOwnerName(profile.name);
  const pct = owner ? 100 : Math.max(0, Math.min(100, (profile.credits / (profile.subscribed ? MONTHLY_PRO_CREDITS : MONTHLY_FREE_CREDITS)) * 100));
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
          <div className="text-3xl font-black tabular-nums">{fmtAmount(profile.credits)}</div>
          <div className="text-xs text-muted-foreground">{owner ? "👑 Owner — unlimited" : profile.subscribed ? "Pro plan" : "Free plan"}</div>
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
          <div className="text-xs text-muted-foreground">+{STREAK_BONUS_CREDITS} {CURRENCY} each time your streak grows (best: {fmtAmount(profile.bestStreak)}).</div>
        </div>
        <div className="rounded-2xl bg-muted/50 p-3 text-sm">
          <div className="font-bold">❓ Questions</div>
          <div className="text-xs text-muted-foreground">−1 {CURRENCY} per question to the AI tutor.</div>
        </div>
      </div>

      {profile.subscribed ? (
        <div className="mt-4 rounded-2xl border border-border p-4 text-sm">
          <span className="font-bold">✅ Focuser Pro active</span> — {MONTHLY_PRO_CREDITS.toLocaleString()} {CURRENCY} per month.
          <p className="mt-2 text-xs text-muted-foreground">
            No refunds on cancel: your payment is not returned and {CURRENCY} already given is never refunded or taken back.
          </p>
        </div>
      ) : null}
    </div>
  );
}
