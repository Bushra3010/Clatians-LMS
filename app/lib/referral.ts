/** A student's referral code: the first 6 hex chars of their id, uppercased.
 * Deterministic, so no extra column is needed to store it. Client-safe. */
export function referralCode(userId: string): string {
  return userId.slice(0, 6).toUpperCase();
}
