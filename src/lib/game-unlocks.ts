import { useCallback, useEffect, useState } from "react";

/** Every game must be unlocked once with a streak + this many Focolara. */
export const GAME_UNLOCK_COST = 30;

export type GameLock = {
  streak: number;
  credits: number;
  cost: number;
  isUnlocked: (id: string) => boolean;
  /** Returns null on success, or a reason string on failure. */
  unlock: (id: string) => string | null;
};

const key = (profileId: string | null) => `focuser.unlocks.${profileId ?? "guest"}`;

export function useGameUnlocks(
  profileId: string | null,
  streak: number,
  credits: number,
  spend: (amount: number) => void,
): GameLock {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key(profileId));
      const parsed = raw ? JSON.parse(raw) : [];
      setIds(Array.isArray(parsed) ? parsed : []);
    } catch { setIds([]); }
  }, [profileId]);

  const isUnlocked = useCallback((id: string) => ids.includes(id), [ids]);

  const unlock = useCallback((id: string) => {
    if (ids.includes(id)) return null;
    // The very first game is free, so a new player can try one straight away.
    const free = ids.length === 0;
    if (!free && streak < 1) return "You need at least a 🔥 1 streak — finish one focus session first.";
    if (!free && credits < GAME_UNLOCK_COST) return `You need ${GAME_UNLOCK_COST} Focolara to unlock this game.`;
    const next = [...ids, id];
    setIds(next);
    try { localStorage.setItem(key(profileId), JSON.stringify(next)); } catch { /* ignore */ }
    if (!free) spend(-GAME_UNLOCK_COST);
    return null;
  }, [ids, streak, credits, spend, profileId]);


  return { streak, credits, cost: GAME_UNLOCK_COST, isUnlocked, unlock };
}
