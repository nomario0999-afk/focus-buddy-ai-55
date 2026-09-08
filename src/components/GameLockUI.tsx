import { GAME_UNLOCK_COST, type GameLock } from "@/lib/game-unlocks";
import { CURRENCY } from "@/lib/profiles";

/** Banner shown at the top of every game section. */
export function LockHeaderBar({ lock }: { lock: GameLock }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-2 text-xs font-semibold">
      <span>🎁 Your first game is free · after that every game unlocks with a 🔥 streak + {GAME_UNLOCK_COST} {CURRENCY}</span>
      <span className="rounded-full bg-background px-2 py-0.5">🔥 {lock.streak}</span>
      <span className="rounded-full bg-background px-2 py-0.5">🪙 {lock.credits.toLocaleString()}</span>
    </div>
  );
}

/** Small status line inside a game tile. */
export function LockTag({ lock, id, wonLabel }: { lock: GameLock; id: string; wonLabel: string }) {
  if (lock.isUnlocked(id)) return <span className="text-primary">{wonLabel}</span>;
  const ready = lock.streak >= 1 && lock.credits >= GAME_UNLOCK_COST;
  return (
    <span className={ready ? "text-primary" : "text-muted-foreground"}>
      🔒 Unlock · {GAME_UNLOCK_COST} {CURRENCY} {lock.streak < 1 ? "+ 1 streak" : ""}
    </span>
  );
}
