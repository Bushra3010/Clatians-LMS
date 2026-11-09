import "server-only";
import { db } from "../db";
import type { SeedQuestion } from "./study-content";
import { ensureTest } from "./demo-syllabus";

// ─────────────────────────────────────────────────────────────
// Chapter tests for the starter syllabus: every chapter gets a test with a
// question on each of its topics, and some get a second one, so a chapter can
// show Test 1, Test 2…. Linked by subject slug + chapter title, so every
// course with the starter chapters gets them; links admins made are kept.
// ─────────────────────────────────────────────────────────────

const E = "English", G = "GK & Current Affairs", L = "Legal Reasoning", R = "Logical Reasoning", Q = "Quantitative";

type ChapterSeed = { slug: string; chapter: string; questions: SeedQuestion[] };
/** A further test for a chapter that already has its first one. */
type ExtraSeed = ChapterSeed & { n: number };

const CHAPTER_TESTS: ChapterSeed[] = [
  // ── English ──
  {
    slug: "english", chapter: "Reading Comprehension",
    questions: [
      { subject: E, passage: "Cities that plant more trees see lower summer temperatures, fewer heat-related hospital visits and calmer residents. Yet most municipal budgets treat trees as decoration rather than infrastructure, funding them only after roads and drains.", text: "Main idea: What is the central point of the passage?", a: "Trees make cities look beautiful.", b: "Trees deliver real public benefits and deserve to be funded like infrastructure.", c: "Roads and drains matter more than trees.", d: "Hospitals are overcrowded in summer.", correct: "b", explanation: "The passage lists the benefits of trees and criticises budgets for treating them as decoration — its point is that trees should be funded as infrastructure." },
      { subject: E, passage: "Cities that plant more trees see lower summer temperatures, fewer heat-related hospital visits and calmer residents. Yet most municipal budgets treat trees as decoration rather than infrastructure, funding them only after roads and drains.", text: "Tone and inference: The author's tone towards municipal budgets is best described as", a: "critical", b: "celebratory", c: "indifferent", d: "humorous", correct: "a", explanation: "'Yet… treat trees as decoration' signals disapproval of how budgets are drawn up." },
      { subject: E, passage: "Cities that plant more trees see lower summer temperatures, fewer heat-related hospital visits and calmer residents. Yet most municipal budgets treat trees as decoration rather than infrastructure, funding them only after roads and drains.", text: "Author's purpose: Why has the author written this passage?", a: "To describe how trees grow", b: "To entertain readers with a story", c: "To persuade readers that trees deserve higher priority in city spending", d: "To explain how drains are built", correct: "c", explanation: "The author builds a case for funding trees — a persuasive purpose." },
    ],
  },
  {
    slug: "english", chapter: "Vocabulary in Context",
    questions: [
      { subject: E, text: "Context clues: 'The lawyer's argument was so cogent that even the opposing counsel nodded in agreement.' COGENT most nearly means", a: "confusing", b: "lengthy", c: "convincing", d: "rude", correct: "c", explanation: "Even the opponent agreed, so the argument must have been convincing." },
      { subject: E, text: "Commonly confused words: Choose the correct word. 'The new rule will ___ every student in the hostel.'", a: "effect", b: "affect", c: "effort", d: "afflict", correct: "b", explanation: "'Affect' is the verb meaning to influence; 'effect' is usually a noun." },
      { subject: E, text: "Idioms and phrases: 'The decision to close the library was the last straw for the students.' THE LAST STRAW means", a: "the final problem in a series that makes a situation unbearable", b: "a small mistake", c: "a lucky chance", d: "the cheapest option", correct: "a", explanation: "The last straw is the final annoyance that makes someone lose patience." },
    ],
  },
  {
    slug: "english", chapter: "Grammar for CLAT",
    questions: [
      { subject: E, text: "Subject-verb agreement: 'The bundle of documents ___ on the judge's table.'", a: "were lying", b: "are lying", c: "is lying", d: "have been lying", correct: "c", explanation: "The subject is 'bundle' (singular), so the verb is 'is'." },
      { subject: E, text: "Tenses and sequence: 'By the time the police arrived, the thief ___.'", a: "escapes", b: "had escaped", c: "has escaped", d: "will escape", correct: "b", explanation: "An action completed before another past action takes the past perfect: 'had escaped'." },
      { subject: E, text: "Sentence correction: Choose the correct sentence.", a: "Each of the students have submitted their forms.", b: "Each of the students has submitted their form.", c: "Each of the student has submitted their forms.", d: "Each of the students submitting their form.", correct: "b", explanation: "'Each' is singular and takes 'has'; 'students' after 'of' stays plural." },
    ],
  },

  // ── Current Affairs & GK ──
  {
    slug: "current-affairs", chapter: "Current Affairs & GK",
    questions: [
      { subject: G, text: "How CLAT tests current affairs: In CLAT, Current Affairs questions are usually asked as", a: "one-word answers with no context", b: "passages on recent events followed by questions", c: "essays to be written", d: "true/false statements only", correct: "b", explanation: "CLAT gives a short passage on a recent event and asks questions based on it and related facts." },
      { subject: G, text: "Daily habit: Which routine best builds current affairs for CLAT?", a: "Reading the newspaper only a week before the exam", b: "Reading one newspaper daily and revising weekly notes", c: "Watching only movies", d: "Memorising old question papers", correct: "b", explanation: "Steady daily reading with weekly revision is what makes current affairs stick." },
    ],
  },
  {
    slug: "current-affairs", chapter: "Legal Current Affairs",
    questions: [
      { subject: G, text: "Reading a Supreme Court judgment: The part of a judgment that is binding on lower courts is called", a: "obiter dicta", b: "ratio decidendi", c: "the headnote", d: "the dissent", correct: "b", explanation: "The ratio decidendi — the legal reason for the decision — is the binding part." },
      { subject: G, text: "Bills and Acts: A Bill passed by both Houses of Parliament becomes an Act after", a: "the Prime Minister signs it", b: "the Supreme Court approves it", c: "the President gives assent", d: "the Speaker signs it", correct: "c", explanation: "Under Article 111, a Bill becomes law when the President gives assent." },
    ],
  },
  {
    slug: "current-affairs", chapter: "Static GK",
    questions: [
      { subject: G, text: "Indian polity basics: The minimum age to become a member of the Lok Sabha is", a: "18 years", b: "21 years", c: "25 years", d: "30 years", correct: "c", explanation: "Article 84 sets the minimum age at 25 years for the Lok Sabha." },
      { subject: G, text: "International organisations: Where is the International Court of Justice located?", a: "The Hague", b: "Geneva", c: "New York", d: "Vienna", correct: "a", explanation: "The ICJ, the principal judicial organ of the UN, sits at The Hague, Netherlands." },
    ],
  },

  // ── Legal Reasoning ──
  {
    slug: "legal-reasoning", chapter: "Law of Torts",
    questions: [
      { subject: L, passage: "Principle: A person who fails to take reasonable care towards someone they owe a duty to, and thereby causes harm, is liable for negligence.", text: "Negligence — Facts: A bus driver texts while driving and hits a cyclist. Is the driver liable?", a: "No, accidents happen.", b: "Yes, texting while driving is a failure of reasonable care that caused the harm.", c: "No, the cyclist should have avoided the bus.", d: "Only the bus company is liable.", correct: "b", explanation: "The driver owed road users a duty of care, breached it by texting, and caused the injury." },
      { subject: L, passage: "Principle: Nuisance is an unlawful interference with a person's use or enjoyment of their land.", text: "Nuisance — Facts: D runs a loud generator every night next to E's house, making sleep impossible. Decide.", a: "D commits nuisance.", b: "No nuisance, as D owns the generator.", c: "No nuisance, as noise is not physical damage.", d: "E commits nuisance by complaining.", correct: "a", explanation: "Nightly noise that stops E from sleeping interferes with the enjoyment of E's home." },
      { subject: L, passage: "Principle: Defamation is the publication of a false statement that lowers a person's reputation in the eyes of others.", text: "Defamation — Facts: F posts on social media, falsely, that G, a shopkeeper, sells fake medicines. Customers stop visiting G. Decide.", a: "No defamation, as social media is private.", b: "No defamation, as G's shop is still open.", c: "F has defamed G.", d: "G has defamed F.", correct: "c", explanation: "A false statement was published to others and harmed G's reputation." },
    ],
  },
  {
    slug: "legal-reasoning", chapter: "Law of Contract",
    questions: [
      { subject: L, passage: "Principle: Consent is not free when it is caused by coercion, undue influence, fraud or misrepresentation; such a contract is voidable at the option of the party whose consent was not free.", text: "Free consent — Facts: H threatens to harm I's family unless I sells his car to H. I signs. Is the contract binding on I?", a: "Yes, I signed it.", b: "It is voidable at I's option, as his consent was caused by coercion.", c: "It is void for both parties.", d: "Yes, if the price was fair.", correct: "b", explanation: "Consent obtained by coercion is not free, so I may avoid the contract." },
      { subject: L, passage: "Principle: An agreement with a minor is void from the beginning.", text: "Minor's agreement — Facts: J, aged 15, borrows ₹50,000 from K by signing a loan agreement. Can K sue J on the agreement?", a: "Yes, a signed loan must be repaid.", b: "No, the agreement is void.", c: "Yes, once J turns 18.", d: "Yes, but only for half the amount.", correct: "b", explanation: "A minor's agreement is void ab initio, so K cannot enforce it." },
      { subject: L, passage: "Principle: An agreement without consideration is void, except in cases the law specifically allows.", text: "Consideration — Facts: L promises to give M ₹10,000 next month for nothing in return. M sues when L does not pay. Decide.", a: "M wins, as a promise is a promise.", b: "M loses, as there was no consideration.", c: "M wins half the amount.", d: "L must pay with interest.", correct: "b", explanation: "A bare promise with nothing in return has no consideration and is void." },
    ],
  },
  {
    slug: "legal-reasoning", chapter: "Criminal Law",
    questions: [
      { subject: L, passage: "Principle: Every person has a right to defend their body against an attack, using no more force than is reasonably necessary.", text: "Private defence — Facts: N attacks O with a knife. O pushes N away and N falls and breaks his arm. Is O liable?", a: "Yes, O caused grievous hurt.", b: "No, O used reasonable force in private defence.", c: "Yes, O should have run away.", d: "Both are equally liable.", correct: "b", explanation: "Facing a knife attack, pushing the attacker away is reasonable force." },
      { subject: L, passage: "Principle: Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, is incapable of knowing the nature of the act.", text: "General exceptions — Facts: P, suffering from a mental illness that stops him knowing what he is doing, injures Q. Is P guilty?", a: "Yes, he injured Q.", b: "No, the exception of unsoundness of mind applies.", c: "Yes, but with a lighter sentence.", d: "Only if Q dies.", correct: "b", explanation: "If P could not know the nature of his act because of unsound mind, the act is not an offence." },
      { subject: L, passage: "Principle: A person abets an offence when they instigate it, conspire to commit it, or intentionally aid it.", text: "Abetment — Facts: R repeatedly urges S to burn T's shop and hands S a can of petrol. S burns the shop. Has R committed abetment?", a: "No, S did the burning.", b: "Yes, R instigated and aided the offence.", c: "No, R was not present.", d: "Only if R was paid.", correct: "b", explanation: "Urging S and supplying the petrol is both instigation and intentional aid." },
    ],
  },
  {
    slug: "legal-reasoning", chapter: "Constitutional Law",
    questions: [
      { subject: L, text: "Fundamental rights: The right to equality before the law is guaranteed by", a: "Article 14", b: "Article 19", c: "Article 21", d: "Article 32", correct: "a", explanation: "Article 14 guarantees equality before the law and equal protection of the laws." },
      { subject: L, text: "Directive Principles: Which statement about Directive Principles of State Policy is correct?", a: "They are enforceable in any court.", b: "They are fundamental in governance but not enforceable by courts.", c: "They can only be changed by the Supreme Court.", d: "They apply only to private companies.", correct: "b", explanation: "Article 37 says DPSPs are not enforceable by courts but are fundamental in governance." },
      { subject: L, text: "Writs: Which writ is issued to produce a detained person before the court?", a: "Mandamus", b: "Certiorari", c: "Habeas Corpus", d: "Quo Warranto", correct: "c", explanation: "Habeas Corpus ('you may have the body') requires a detained person to be produced before the court." },
    ],
  },

  // ── Logical Reasoning ──
  {
    slug: "logical-reasoning", chapter: "Critical Reasoning",
    questions: [
      { subject: R, text: "Assumptions: 'The college should start evening classes so that working students can study.' Which assumption is made?", a: "Some working students are free in the evening.", b: "All students work during the day.", c: "Evening classes are cheaper.", d: "Teachers prefer evenings.", correct: "a", explanation: "The suggestion only helps if working students can attend in the evening." },
      { subject: R, text: "Strengthen and weaken: 'Using phones in class lowers marks.' Which statement STRENGTHENS this claim?", a: "Some toppers use phones at home.", b: "Students who kept phones away in class scored higher than those who did not.", c: "Phones are expensive.", d: "Teachers also use phones.", correct: "b", explanation: "A comparison showing higher marks without phones directly supports the claim." },
      { subject: R, text: "Inference: 'Every candidate who cleared the interview was offered the job. Asha was not offered the job.' What can be inferred?", a: "Asha cleared the interview.", b: "Asha did not clear the interview.", c: "Asha did not apply.", d: "Nothing can be inferred.", correct: "b", explanation: "Clearing the interview guarantees an offer; no offer means Asha did not clear it." },
    ],
  },
  {
    slug: "logical-reasoning", chapter: "Analytical Reasoning",
    questions: [
      { subject: R, text: "Seating arrangement: Five friends sit in a row. B is to the immediate right of A, C is at the extreme left, and D is between C and A. Who sits in the middle?", a: "A", b: "B", c: "D", d: "E", correct: "a", explanation: "From the left: C, D, A, B, E — A is in the middle." },
      { subject: R, text: "Blood relations: 'Mohan is the brother of Sita. Sita is the mother of Arjun.' How is Mohan related to Arjun?", a: "Father", b: "Maternal uncle", c: "Brother", d: "Grandfather", correct: "b", explanation: "Mohan is the brother of Arjun's mother, so he is Arjun's maternal uncle." },
      { subject: R, text: "Direction sense: Ravi walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. In which direction is he from his starting point?", a: "North", b: "South", c: "East", d: "West", correct: "c", explanation: "North 5, east 3, south 5 — he ends 3 km east of where he started." },
    ],
  },
  {
    slug: "logical-reasoning", chapter: "Syllogisms",
    questions: [
      { subject: R, text: "Basics of syllogism: 'All judges are lawyers. All lawyers are graduates.' Conclusion: 'All judges are graduates.'", a: "Definitely true", b: "Definitely false", c: "Possibly true", d: "Cannot be determined", correct: "a", explanation: "Judges ⊂ lawyers ⊂ graduates, so every judge is a graduate." },
      { subject: R, text: "Possibility cases: 'Some pens are blue. No blue is red.' Which is a valid possibility?", a: "All pens are red is definitely true.", b: "Some pens being red is possible.", c: "No pen can be red.", d: "All blue things are pens.", correct: "b", explanation: "Only the blue pens can't be red; the other pens may be red, so 'some pens are red' is possible." },
    ],
  },

  // ── Quantitative ──
  {
    slug: "quantitative", chapter: "Arithmetic Basics",
    questions: [
      { subject: Q, text: "Percentages: A salary of ₹40,000 is increased by 15%. What is the new salary?", a: "₹44,000", b: "₹46,000", c: "₹45,000", d: "₹46,500", correct: "b", explanation: "15% of 40,000 is 6,000, so the new salary is ₹46,000." },
      { subject: Q, text: "Ratio and proportion: ₹1,200 is divided between A and B in the ratio 5 : 7. What is B's share?", a: "₹500", b: "₹600", c: "₹700", d: "₹720", correct: "c", explanation: "One part = 1200 ÷ 12 = 100, so B gets 7 × 100 = ₹700." },
      { subject: Q, text: "Averages: The average of 4 numbers is 25. If a fifth number, 35, is added, what is the new average?", a: "27", b: "28", c: "30", d: "26", correct: "a", explanation: "Total = 100 + 35 = 135, and 135 ÷ 5 = 27." },
    ],
  },
  {
    slug: "quantitative", chapter: "Data Interpretation",
    questions: [
      { subject: Q, passage: "Table — Students enrolled: 2022: 400, 2023: 500, 2024: 650.", text: "Reading tables: By what percentage did enrolment rise from 2023 to 2024?", a: "25%", b: "30%", c: "35%", d: "15%", correct: "b", explanation: "The rise is 150 on 500, which is 30%." },
      { subject: Q, passage: "Pie chart — A family's monthly spend of ₹50,000: Rent 30%, Food 25%, Education 20%, Travel 10%, Savings 15%.", text: "Bar and pie charts: How much does the family spend on Education?", a: "₹8,000", b: "₹12,500", c: "₹10,000", d: "₹15,000", correct: "c", explanation: "20% of ₹50,000 is ₹10,000." },
    ],
  },
];

const EXTRA_TESTS: ExtraSeed[] = [
  {
    slug: "english", chapter: "Reading Comprehension", n: 2,
    questions: [
      { subject: E, passage: "Online classes promised to bring the best teachers to every village. Five years on, the students who gained most were those who already had quiet rooms, steady internet and parents who could help. For the rest, the screen became one more door that stayed shut.", text: "Main idea: What does the passage mainly suggest?", a: "Online classes failed everywhere.", b: "Online classes helped mostly those who were already well placed.", c: "Village teachers are the best teachers.", d: "Internet speed has improved in villages.", correct: "b", explanation: "The passage says the biggest gains went to students who already had the right conditions." },
      { subject: E, passage: "Online classes promised to bring the best teachers to every village. Five years on, the students who gained most were those who already had quiet rooms, steady internet and parents who could help. For the rest, the screen became one more door that stayed shut.", text: "Tone and inference: The phrase 'one more door that stayed shut' implies that", a: "students disliked studying", b: "online classes added another barrier for disadvantaged students", c: "schools were closed", d: "screens were broken", correct: "b", explanation: "The metaphor shows online classes became yet another obstacle for students without support." },
      { subject: E, passage: "Online classes promised to bring the best teachers to every village. Five years on, the students who gained most were those who already had quiet rooms, steady internet and parents who could help. For the rest, the screen became one more door that stayed shut.", text: "Author's purpose: The author most likely wants to", a: "sell internet plans", b: "question whether online education reduced inequality", c: "praise village schools", d: "describe how to set up a classroom", correct: "b", explanation: "The author contrasts the promise with the result to question its effect on inequality." },
    ],
  },
  {
    slug: "legal-reasoning", chapter: "Law of Torts", n: 2,
    questions: [
      { subject: L, passage: "Principle: A person is liable for negligence only if their failure to take reasonable care caused the harm.", text: "Negligence — Facts: A shop leaves its floor wet without a warning sign. U, walking while looking at his phone, slips but would have slipped on a dry floor too because he tripped over his own shoelace. Is the shop liable?", a: "Yes, the floor was wet.", b: "No, the shop's carelessness did not cause the fall.", c: "Yes, shops are always liable for falls.", d: "No, because U was using a phone.", correct: "b", explanation: "The fall came from the shoelace, not the wet floor, so the shop's breach did not cause the harm." },
      { subject: L, passage: "Principle: Nuisance requires an unreasonable interference with another's use or enjoyment of land; ordinary use of one's own property is not nuisance.", text: "Nuisance — Facts: V's neighbour W cooks food at normal hours, and the smell sometimes reaches V's flat. Is W liable for nuisance?", a: "Yes, any smell is nuisance.", b: "No, ordinary cooking is a reasonable use of property.", c: "Yes, if V is vegetarian.", d: "No, because V can close the window.", correct: "b", explanation: "Cooking at normal hours is ordinary, reasonable use and not an unreasonable interference." },
      { subject: L, passage: "Principle: Truth is a complete defence to a claim of defamation.", text: "Defamation — Facts: X publishes that Y, a public official, was convicted of bribery. Y was in fact convicted. Y sues for defamation. Decide.", a: "Y wins, as his reputation was harmed.", b: "X is not liable, as the statement is true.", c: "Y wins, as officials cannot be criticised.", d: "Both are liable.", correct: "b", explanation: "The statement is true, and truth is a complete defence." },
    ],
  },
];

/** Creates each chapter test once and attaches it to every matching starter chapter. */
export async function seedChapterTests(authorId: string | null): Promise<void> {
  const all = [
    ...CHAPTER_TESTS.map((c) => ({ ...c, n: 1, title: `${c.chapter} — Chapter Test` })),
    ...EXTRA_TESTS.map((c) => ({ ...c, title: `${c.chapter} — Chapter Test ${c.n}` })),
  ];
  for (const c of all) {
    const testId = await ensureTest(
      c.title,
      `${c.questions.length} questions covering every topic in ${c.chapter}.`,
      "practice", 10, c.questions, authorId,
    );
    await db.prepare(
      `INSERT INTO chapter_tests (chapter_id, test_id, sort_order)
       SELECT ch.id, ?, ? FROM chapters ch
       JOIN modules m ON m.id = ch.module_id
       JOIN subjects s ON s.id = m.subject_id
       WHERE ch.title = ? AND s.slug = ?
       ON CONFLICT DO NOTHING`
    ).run(testId, c.n, c.chapter, c.slug);
  }
}
