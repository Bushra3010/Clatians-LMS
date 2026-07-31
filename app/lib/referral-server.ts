import "server-only";
import { db } from "./db";
import { notify } from "./notify";
import { REFERRAL_REWARD } from "./referral";

/**
 * Credit the referrer when a referred lead enrolls. Idempotent — the
 * `leads.reward_given` flag guarantees at most one reward per lead, whichever
 * path marks it enrolled (convert-to-student or a manual status change).
 */
export async function awardReferralIfDue(leadId: string): Promise<void> {
  const lead = await db.prepare(
    "SELECT name, referred_by, reward_given FROM leads WHERE id = ?"
  ).get(leadId) as { name: string; referred_by: string | null; reward_given: number } | undefined;
  if (!lead || !lead.referred_by || lead.reward_given === 1) return;

  await db.prepare("UPDATE leads SET reward_given = 1 WHERE id = ?").run(leadId);
  await db.prepare("UPDATE users SET referral_credit = referral_credit + ? WHERE id = ?").run(REFERRAL_REWARD, lead.referred_by);
  await notify(
    lead.referred_by,
    "payment",
    `You earned ₹${REFERRAL_REWARD} referral credit! 🎉`,
    `${lead.name} enrolled through your referral. The credit auto-applies as a discount on your next fee payment.`
  );
}
