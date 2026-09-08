/** The two people who own Focuser. Their accounts are unlimited. */
export const OWNER_NAMES = ["Muhammad Noman Hussain", "Ammar Khan"] as const;

/** Big enough to never run out; still a real number so it saves fine. */
export const UNLIMITED = 999_999_999;

export function isOwnerName(name: string | undefined | null): boolean {
  const n = (name ?? "").trim().toLowerCase();
  return OWNER_NAMES.some((o) => o.toLowerCase() === n);
}

/** Shows ∞ for owner-sized amounts, otherwise a normal number. */
export function fmtAmount(n: number): string {
  return n >= UNLIMITED ? "∞" : n.toLocaleString();
}
