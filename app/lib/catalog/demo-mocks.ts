import "server-only";
import type { SeedQuestion } from "./study-content";
import { ensureTest } from "./demo-syllabus";

// ─────────────────────────────────────────────────────────────
// Full mock tests for a batch's Tests tab: every paper mixes all five CLAT
// sections (2 questions each, interleaved), so students practise switching
// between sections as in the real exam.
// ─────────────────────────────────────────────────────────────

const E = "English", G = "GK & Current Affairs", L = "Legal Reasoning", R = "Logical Reasoning", Q = "Quantitative";

const MOCKS: { title: string; questions: SeedQuestion[] }[] = [
  {
    title: "CLATians Full Mock Test 1 — All Sections",
    questions: [
      { subject: E, text: "Choose the word most similar in meaning to EPHEMERAL.", a: "Lasting", b: "Short-lived", c: "Heavenly", d: "Essential", correct: "b", explanation: "Ephemeral means lasting for a very short time." },
      { subject: G, text: "Which Article of the Constitution of India abolishes untouchability?", a: "Article 14", b: "Article 15", c: "Article 17", d: "Article 21", correct: "c", explanation: "Article 17 abolishes untouchability and forbids its practice in any form." },
      { subject: L, passage: "Principle: A person is liable for negligence when they owe a duty of care, breach it, and the breach causes damage.", text: "Facts: A surgeon leaves a sponge inside a patient after an operation. The patient later develops an infection because of it. Decide.", a: "The surgeon is liable for negligence.", b: "The surgeon is not liable, as infections are common after surgery.", c: "The surgeon is not liable, as the patient consented to the surgery.", d: "The surgeon is liable only if he intended the harm.", correct: "a", explanation: "The surgeon owed a duty of care, breached it by leaving the sponge, and the breach caused the infection. Intention is not needed for negligence." },
      { subject: R, text: "All lawyers are graduates. Some graduates are teachers. Which conclusion definitely follows?", a: "All lawyers are teachers.", b: "Some teachers are lawyers.", c: "No teacher is a lawyer.", d: "Some graduates are lawyers.", correct: "d", explanation: "Since every lawyer is a graduate, some graduates must be lawyers. Nothing definite follows about teachers and lawyers." },
      { subject: Q, text: "A shopkeeper marks an item 25% above cost price and gives a 10% discount. What is the profit percentage?", a: "15%", b: "10%", c: "12.5%", d: "11.25%", correct: "c", explanation: "Selling price = 1.25 × 0.9 = 1.125 of cost, so the profit is 12.5%." },
      { subject: E, text: "Choose the correctly spelt word.", a: "Accomodate", b: "Acommodate", c: "Accommodatte", d: "Accommodate", correct: "d", explanation: "Accommodate has a double 'c' and a double 'm'." },
      { subject: G, text: "Who appoints the Chief Justice of India?", a: "The President", b: "The Prime Minister", c: "Parliament", d: "The Law Minister", correct: "a", explanation: "Under Article 124, the President appoints the Chief Justice of India." },
      { subject: L, passage: "Principle: An agreement without consideration is void, unless it is in writing, registered, and made out of natural love and affection between parties in a near relation.", text: "Facts: A father, out of love, promises his son ₹1 lakh in a written and registered document. Is the promise enforceable?", a: "No, because there is no consideration.", b: "Yes, it falls within the exception.", c: "No, because the son is an adult.", d: "Yes, but only if the son pays something in return.", correct: "b", explanation: "The promise is written, registered and made out of love between near relatives, so the exception applies." },
      { subject: R, text: "Find the next number: 2, 6, 12, 20, 30, ?", a: "40", b: "36", c: "44", d: "42", correct: "d", explanation: "The differences are 4, 6, 8, 10, so the next difference is 12 and 30 + 12 = 42." },
      { subject: Q, text: "The average of 5 numbers is 20. When one number is removed, the average of the rest is 18. Which number was removed?", a: "28", b: "26", c: "30", d: "22", correct: "a", explanation: "Total = 100. The remaining four total 72, so the removed number is 28." },
    ],
  },
  {
    title: "CLATians Full Mock Test 2 — All Sections",
    questions: [
      { subject: E, text: "Choose the word opposite in meaning to BENEVOLENT.", a: "Kind", b: "Generous", c: "Malevolent", d: "Charitable", correct: "c", explanation: "Benevolent means well-meaning; malevolent means wishing harm to others." },
      { subject: G, text: "The words 'Socialist' and 'Secular' were added to the Preamble by which Constitutional Amendment?", a: "42nd", b: "44th", c: "24th", d: "52nd", correct: "a", explanation: "The 42nd Amendment Act, 1976 added 'Socialist', 'Secular' and 'Integrity' to the Preamble." },
      { subject: L, passage: "Principle: The right of private defence of the body extends to causing death only if the assailant's act reasonably causes apprehension of death or grievous hurt.", text: "Facts: X lightly slaps Y once and walks away. Y takes out a gun and shoots X dead. Is Y protected?", a: "Yes, because a slap is an assault.", b: "No, because a light slap gives no reasonable apprehension of death or grievous hurt.", c: "Yes, because Y was defending his dignity.", d: "Only X is at fault.", correct: "b", explanation: "A light slap followed by walking away cannot reasonably cause fear of death or grievous hurt, so causing death is not protected." },
      { subject: R, text: "If CAT is coded as DBU, how is DOG coded?", a: "EPH", b: "FQI", c: "DPH", d: "EOH", correct: "a", explanation: "Each letter moves one step forward: D→E, O→P, G→H." },
      { subject: Q, text: "The ratio of A to B is 3 : 5. If B is 40, what is A?", a: "20", b: "30", c: "25", d: "24", correct: "d", explanation: "One part = 40 ÷ 5 = 8, so A = 3 × 8 = 24." },
      { subject: E, text: "Fill in the blank: She has been working here ___ 2019.", a: "for", b: "since", c: "from", d: "by", correct: "b", explanation: "'Since' is used with a point in time with the present perfect continuous." },
      { subject: G, text: "Which body conducts elections to Parliament and State Legislatures in India?", a: "The Supreme Court", b: "The Ministry of Home Affairs", c: "The Election Commission of India", d: "Parliament", correct: "c", explanation: "Article 324 vests the conduct of these elections in the Election Commission of India." },
      { subject: L, passage: "Principle: Trespass to land is the unlawful entry onto another person's land without permission.", text: "Facts: P's cricket ball lands in Q's garden. Without asking Q, P climbs in to get it back. Decide.", a: "P committed trespass, as he entered without permission.", b: "No trespass, as his purpose was harmless.", c: "No trespass, as the ball belongs to P.", d: "Q is liable for keeping the ball.", correct: "a", explanation: "Entry without permission is enough for trespass; a harmless purpose does not make it lawful." },
      { subject: R, text: "Pointing to a man, Riya says, 'He is the son of my grandfather's only son.' How is the man related to Riya?", a: "Cousin", b: "Uncle", c: "Father", d: "Brother", correct: "d", explanation: "Her grandfather's only son is her father, and her father's son is her brother." },
      { subject: Q, text: "A 200 m long train crosses a pole in 10 seconds. What is its speed?", a: "72 km/h", b: "60 km/h", c: "80 km/h", d: "54 km/h", correct: "a", explanation: "Speed = 200 ÷ 10 = 20 m/s = 20 × 18/5 = 72 km/h." },
    ],
  },
  {
    title: "CLATians Full Mock Test 3 — All Sections",
    questions: [
      { subject: E, text: "What does the idiom 'to beat around the bush' mean?", a: "To work very hard", b: "To avoid coming to the main point", c: "To search carefully", d: "To be lazy", correct: "b", explanation: "To beat around the bush is to avoid talking about the main point." },
      { subject: G, text: "Which Article is called the 'heart and soul' of the Constitution and gives the right to constitutional remedies?", a: "Article 19", b: "Article 21", c: "Article 226", d: "Article 32", correct: "d", explanation: "Dr. B.R. Ambedkar called Article 32 the heart and soul of the Constitution." },
      { subject: L, passage: "Principle: An agreement with a minor is void from the beginning.", text: "Facts: A 16-year-old signs a contract to buy a motorbike in instalments and later stops paying. Can the seller enforce the contract against him?", a: "Yes, the contract is valid.", b: "Yes, once the boy turns 18.", c: "No, the agreement is void and cannot be enforced against the minor.", d: "No, but his parents must pay.", correct: "c", explanation: "A minor's agreement is void ab initio, so it cannot be enforced against the minor." },
      { subject: R, text: "Statement: All successful students practise mock tests daily. Riya is a successful student. Which conclusion follows?", a: "Riya practises mock tests daily.", b: "Riya does not practise mock tests.", c: "Riya teaches mock tests.", d: "None of these follows.", correct: "a", explanation: "Riya belongs to the group of successful students, all of whom practise mock tests daily." },
      { subject: Q, text: "What is the simple interest on ₹5,000 at 8% per annum for 3 years?", a: "₹1,000", b: "₹1,500", c: "₹1,200", d: "₹800", correct: "c", explanation: "SI = 5000 × 8 × 3 ÷ 100 = ₹1,200." },
      { subject: E, text: "Choose the grammatically correct sentence.", a: "Neither of the boys has finished.", b: "Neither of the boys have finished.", c: "Neither of the boy has finished.", d: "Neither the boys has finished.", correct: "a", explanation: "'Neither of' takes a singular verb, so 'has' is correct." },
      { subject: G, text: "Fundamental Duties were added to the Constitution on the recommendation of which committee?", a: "Sarkaria Committee", b: "Swaran Singh Committee", c: "Balwant Rai Mehta Committee", d: "Kothari Commission", correct: "b", explanation: "The Swaran Singh Committee (1976) recommended the Fundamental Duties, added by the 42nd Amendment." },
      { subject: L, passage: "Principle: Whoever, intending to take dishonestly any movable property out of another's possession without consent, moves that property, commits theft.", text: "Facts: A takes B's umbrella from a café, honestly believing it to be his own identical umbrella. Has A committed theft?", a: "Yes, as B did not consent.", b: "No, as A had no dishonest intention.", c: "Yes, as the umbrella belonged to B.", d: "Only if A keeps it after finding out.", correct: "b", explanation: "Theft needs dishonest intention. An honest mistake about ownership means there is no theft." },
      { subject: R, text: "Find the odd one out.", a: "Square", b: "Rectangle", c: "Triangle", d: "Cube", correct: "d", explanation: "A cube is a three-dimensional solid; the rest are flat shapes." },
      { subject: Q, text: "If 40% of a number is 120, what is the number?", a: "280", b: "300", c: "320", d: "360", correct: "b", explanation: "Number = 120 ÷ 0.4 = 300." },
    ],
  },
];

/** Creates the full mock tests once (keyed on title); later runs leave them alone. */
export async function seedDemoMocks(authorId: string | null): Promise<void> {
  for (const m of MOCKS) {
    await ensureTest(
      m.title,
      "A full-length style paper with English, GK & Current Affairs, Legal Reasoning, Logical Reasoning and Quantitative questions mixed together.",
      "mock", 15, m.questions, authorId,
    );
  }
}
