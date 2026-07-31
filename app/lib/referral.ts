/** A student's referral code: the first 6 hex chars of their id, uppercased.
 * Deterministic, so no extra column is needed to store it. Client-safe. */
export function referralCode(userId: string): string {
  return userId.slice(0, 6).toUpperCase();
}

/** Reward credited to the referrer (₹) each time a referred lead enrolls.
 * Credit auto-applies as a discount on the referrer's next fee payment. */
export const REFERRAL_REWARD = 500;
