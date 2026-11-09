import "server-only";
import { db } from "../db";
import type { SeedQuestion } from "./study-content";
import { ensureTest } from "./demo-syllabus";

// ─────────────────────────────────────────────────────────────
// Extra topic tests for the starter syllabus, so a topic shows Topic Test 1,
// Topic Test 2…. Linked by subject slug + topic title; links admins made are kept.
// ─────────────────────────────────────────────────────────────

const E = "English", L = "Legal Reasoning";

type TopicSeed = { slug: string; topic: string; n: number; questions: SeedQuestion[] };

const P1 = "Social media lets lawyers reach clients directly, but bar council rules on advertising were written for newspapers. Unless the rules are updated, young lawyers will either break them without knowing it or lose clients to those who do.";
const P2 = "Libraries are no longer quiet rooms of books. Many now lend laptops, run coding clubs and offer free internet to people who have none. Measuring them by how many books they lend misses most of what they now do.";

const TOPIC_TESTS: TopicSeed[] = [
  {
    slug: "english", topic: "Finding the Main Idea", n: 1,
    questions: [
      { subject: E, passage: P1, text: "What is the main idea of the passage?", a: "Lawyers should stop using social media.", b: "Advertising rules for lawyers need updating for social media.", c: "Newspapers are the best place for lawyers to advertise.", d: "Young lawyers break rules on purpose.", correct: "b", explanation: "The passage says the rules were written for newspapers and must be updated, or young lawyers will suffer." },
      { subject: E, passage: P1, text: "The author's attitude towards the current rules is best described as", a: "concerned", b: "admiring", c: "amused", d: "neutral", correct: "a", explanation: "The author warns of bad outcomes unless the rules change — a concerned attitude." },
      { subject: E, passage: P1, text: "Why does the author mention young lawyers losing clients?", a: "To show that social media is useless", b: "To show the cost of leaving the rules unchanged", c: "To praise older lawyers", d: "To criticise clients", correct: "b", explanation: "It illustrates what goes wrong if the rules are not updated, supporting the main point." },
    ],
  },
  {
    slug: "english", topic: "Finding the Main Idea", n: 2,
    questions: [
      { subject: E, passage: P2, text: "Which option best states the main idea?", a: "Libraries should stop lending books.", b: "Libraries now do far more than lend books, so they should be judged differently.", c: "Coding clubs are more popular than books.", d: "Everyone now has free internet.", correct: "b", explanation: "The passage lists new services and says counting book loans misses most of the work." },
      { subject: E, passage: P2, text: "The phrase 'misses most of what they now do' implies that", a: "book lending is now only a small part of a library's work", b: "libraries have stopped lending books", c: "libraries do very little", d: "book loans are rising fast", correct: "a", explanation: "If book loans miss 'most' of the work, lending is only a small share of what libraries do." },
      { subject: E, passage: P2, text: "The author's purpose is to", a: "describe the history of libraries", b: "argue for a better way to measure libraries", c: "advertise a coding club", d: "complain about the internet", correct: "b", explanation: "The final sentence argues that the current measure is wrong — a call for a better one." },
    ],
  },
  {
    slug: "legal-reasoning", topic: "Negligence", n: 2,
    questions: [
      { subject: L, passage: "Principle: A person owes a duty of care to everyone who could foreseeably be harmed by their carelessness.", text: "Facts: A mechanic carelessly repairs a car's brakes. The brakes fail and the car hits a pedestrian. Is the mechanic liable to the pedestrian?", a: "No, the pedestrian was not his customer.", b: "Yes, a pedestrian is someone who could foreseeably be harmed.", c: "No, only the driver is liable.", d: "Yes, but only if the pedestrian paid for the repair.", correct: "b", explanation: "Faulty brakes foreseeably endanger road users, so the mechanic owed the pedestrian a duty of care." },
      { subject: L, passage: "Principle: If the injured person's own carelessness added to the harm, their compensation is reduced (contributory negligence).", text: "Facts: A careless driver hits a cyclist who was not wearing a helmet; the head injury is worse because of this. Decide.", a: "The driver is not liable at all.", b: "The driver is liable, but compensation is reduced for the missing helmet.", c: "The cyclist must pay the driver.", d: "The driver must pay double.", correct: "b", explanation: "The driver caused the accident, but the cyclist's carelessness added to the injury, so compensation is reduced." },
      { subject: L, passage: "Principle: When the thing that caused harm was under the defendant's control and such an accident does not normally happen without carelessness, negligence is presumed (res ipsa loquitur).", text: "Facts: A sack of flour falls from a warehouse's upper window onto a passer-by. Decide.", a: "The passer-by must prove exactly how the sack fell.", b: "Negligence is presumed; the warehouse must explain the fall.", c: "No one is liable for falling objects.", d: "The passer-by was careless to walk there.", correct: "b", explanation: "Sacks don't fall from windows without carelessness, and the warehouse controlled them — negligence is presumed." },
    ],
  },
  {
    slug: "legal-reasoning", topic: "Free Consent", n: 2,
    questions: [
      { subject: L, passage: "Principle: A contract is caused by undue influence when one party is in a position to dominate the will of the other and uses it to obtain an unfair advantage; such a contract is voidable.", text: "Facts: A spiritual guru persuades a devotee to gift him all her property for 'salvation'. Decide.", a: "The gift is valid as she agreed.", b: "The gift is voidable for undue influence.", c: "The gift is void for fraud.", d: "The guru must pay for the property.", correct: "b", explanation: "The guru could dominate the devotee's will and used it for an unfair gain — undue influence." },
      { subject: L, passage: "Principle: Fraud includes active concealment of a fact by a party who knows it, with intent to deceive; a contract caused by fraud is voidable.", text: "Facts: A seller paints over cracks in a car's chassis to hide them, and the buyer purchases the car. Decide.", a: "The contract is binding; the buyer should have checked.", b: "The contract is voidable at the buyer's option for fraud.", c: "The contract is void for both parties.", d: "Only the painter is liable.", correct: "b", explanation: "Painting over the cracks is active concealment meant to deceive, so the buyer may avoid the contract." },
      { subject: L, passage: "Principle: Where both parties are mistaken about a fact essential to the agreement, the agreement is void.", text: "Facts: A sells B a horse which, unknown to both, had died the previous day. Decide.", a: "The agreement is void.", b: "B must still pay.", c: "A must deliver another horse.", d: "The agreement is voidable at A's option.", correct: "a", explanation: "Both were mistaken about the horse being alive, an essential fact, so the agreement is void." },
    ],
  },
  {
    slug: "legal-reasoning", topic: "Right of Private Defence", n: 2,
    questions: [
      { subject: L, passage: "Principle: There is no right of private defence when there is time to seek the protection of public authorities.", text: "Facts: X learns that Y plans to beat him next week. Today X goes to Y's house and beats him. Can X claim private defence?", a: "Yes, he was protecting himself.", b: "No, he had time to approach the police.", c: "Yes, because Y planned the attack.", d: "No, because X used his hands.", correct: "b", explanation: "The threat was a week away, so X had time to approach the authorities; private defence is not available." },
      { subject: L, passage: "Principle: The right of private defence extends to protecting one's property against theft.", text: "Facts: P sees a thief running off with his bag, catches him and pulls the bag back; the thief falls and is bruised. Is P protected?", a: "Yes, he used reasonable force to protect his property.", b: "No, he should have let the thief go.", c: "No, bruising is an offence.", d: "Only if P was a police officer.", correct: "a", explanation: "Recovering the bag with reasonable force is private defence of property against theft." },
      { subject: L, passage: "Principle: There is no right of private defence against an act done in good faith by a public servant acting in the course of duty, unless it causes reasonable fear of death or grievous hurt.", text: "Facts: A police officer arrests Q under a warrant with a minor typing error. Q punches the officer. Is Q protected?", a: "Yes, the warrant had an error.", b: "No, the officer acted in good faith and there was no threat of death or grievous hurt.", c: "Yes, everyone may resist arrest.", d: "Only if Q was innocent.", correct: "b", explanation: "The officer acted in good faith in the course of duty, and the arrest caused no fear of death or grievous hurt." },
    ],
  },
];

/** Creates each extra topic test once and attaches it to every matching starter topic. */
export async function seedTopicTests(authorId: string | null): Promise<void> {
  for (const t of TOPIC_TESTS) {
    const testId = await ensureTest(
      `${t.topic} — Topic Test ${t.n}`,
      `${t.questions.length} questions on ${t.topic}.`,
      "practice", 0, t.questions, authorId,
    );
    await db.prepare(
      `INSERT INTO lesson_tests (lesson_id, test_id, sort_order)
       SELECT l.id, ?, ? FROM lessons l
       JOIN chapters ch ON ch.id = l.chapter_id
       JOIN modules m ON m.id = ch.module_id
       JOIN subjects s ON s.id = m.subject_id
       WHERE l.title = ? AND s.slug = ?
       ON CONFLICT DO NOTHING`
    ).run(testId, t.n, t.topic, t.slug);
  }
}
