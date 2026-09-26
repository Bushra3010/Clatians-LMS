// ─────────────────────────────────────────────────────────────
// Starter study content for the subject → chapter → topic view, plus the
// Legal Reasoning comprehension test series (a passage, then 3 MCQs on it —
// the CLAT pattern).
//
// Seeded once per course and never overwritten: admins edit, extend or delete
// all of it from Admin → Courses → Study content. Videos are left blank for
// faculty to attach their own lectures.
// ─────────────────────────────────────────────────────────────

import { db, newId } from "../db";
import type { SeedQuestion } from "./study-content";

type Comprehension = { topic: string; passage: string; questions: Omit<SeedQuestion, "subject" | "passage">[] };

const LR = "Legal Reasoning";

const NEGLIGENCE: Comprehension = {
  topic: "Negligence",
  passage: `PRINCIPLE: A person is liable in negligence when (i) they owe the injured person a duty of care, (ii) they breach that duty by failing to act as a reasonably careful person would in the circumstances, and (iii) the breach causes damage that is not too remote. A duty of care is owed to anyone whom a person can reasonably foresee being harmed by their carelessness.

FACTS: Raghav drives a school van. On a rainy morning, while driving at the permitted speed, he answered a phone call and looked down at the screen for a few seconds. The van drifted and hit a road divider. Tanya, a student sitting in the van, broke her arm. Raghav argues that he was within the speed limit and that the road was slippery because of the rain.`,
  questions: [
    {
      text: "Did Raghav owe Tanya a duty of care?",
      a: "No, because the duty is owed only to other drivers on the road.",
      b: "Yes, because a passenger in the van he was driving is someone he could reasonably foresee being harmed by careless driving.",
      c: "No, because Tanya's parents had contracted with the school, not with Raghav.",
      d: "Yes, but only because Tanya was a minor.",
      correct: "b",
      explanation: "The duty is owed to anyone foreseeably harmed by carelessness. A passenger in the vehicle is the most obvious example. Nothing in the principle limits the duty to drivers, to contracting parties, or to minors.",
    },
    {
      text: "Raghav's strongest-sounding defence is that he was within the speed limit. Applying the principle, this defence:",
      a: "Succeeds, because obeying the speed limit is conclusive proof of reasonable care.",
      b: "Succeeds, because the rain, not Raghav, caused the accident.",
      c: "Fails, because breach is judged by whether he acted as a reasonably careful driver would; looking at a phone while driving in the rain is not reasonable care, whatever the speed.",
      d: "Fails, because a driver is strictly liable for every accident.",
      correct: "c",
      explanation: "Breach asks whether the conduct fell below that of a reasonably careful person. Speed is one factor, not the whole test. Option (d) is wrong because the principle is fault-based, not strict liability.",
    },
    {
      text: "Which additional fact, if true, would most weaken Tanya's claim?",
      a: "The van's brakes had suddenly and invisibly failed a second before the drift, and the van would have hit the divider even if Raghav had been looking at the road.",
      b: "Raghav had been driving the van for ten years without an accident.",
      c: "Tanya was not wearing her seat belt, although her arm would have broken anyway.",
      d: "The phone call was from the school principal.",
      correct: "a",
      explanation: "If the accident would have happened even without the breach, the breach did not cause the damage, and the third element fails. A good past record (b) or the caller's identity (d) does not affect breach or causation. In (c), the injury would have happened regardless.",
    },
  ],
};

const FREE_CONSENT: Comprehension = {
  topic: "Free Consent",
  passage: `PRINCIPLE: An agreement is a contract only when the parties give free consent. Consent is not free when it is caused by coercion. Coercion means committing, or threatening to commit, an act forbidden by law in order to make a person enter into an agreement. A contract whose consent was caused by coercion is voidable at the option of the party whose consent was so caused: that party may either cancel it or choose to go ahead with it.

FACTS: Kabir wanted to buy Meena's shop, but she refused to sell. Kabir then told her that unless she signed a sale agreement, he would have her son beaten up. Frightened, Meena signed the agreement at a fair market price. A week later her son moved abroad and Meena was no longer afraid.`,
  questions: [
    {
      text: "Was Meena's consent free?",
      a: "Yes, because the price was fair.",
      b: "Yes, because the threat was made against her son, not against Meena herself.",
      c: "No, because she signed because of a threat to commit an act forbidden by law.",
      d: "No, because Kabir had no genuine need for the shop.",
      correct: "c",
      explanation: "Coercion is threatening an unlawful act to procure the agreement. Assault is forbidden by law, and the principle does not require the threat to be aimed at the contracting party. A fair price does not cure the lack of free consent.",
    },
    {
      text: "What is the legal status of the sale agreement?",
      a: "Void from the beginning; neither party can enforce it.",
      b: "Voidable at Meena's option.",
      c: "Voidable at Kabir's option.",
      d: "Valid, because Meena signed it.",
      correct: "b",
      explanation: "The principle says a contract caused by coercion is voidable at the option of the party whose consent was caused by coercion. That party is Meena, not Kabir.",
    },
    {
      text: "Now that her son has moved abroad, Meena decides she is happy with the price and wants the sale to go through. Can she?",
      a: "No, because a coerced contract can never be enforced.",
      b: "Yes, because a voidable contract may be affirmed by the party who had the option to avoid it.",
      c: "Only if Kabir apologises.",
      d: "Only if a court first declares the contract void.",
      correct: "b",
      explanation: "'Voidable at the option of' Meena means she chooses. She may cancel the contract or affirm it. Option (a) describes a void agreement, which is a different thing.",
    },
  ],
};

const PRIVATE_DEFENCE: Comprehension = {
  topic: "Right of Private Defence",
  passage: `PRINCIPLE: Every person has a right to defend their own body, and the body of any other person, against an offence affecting the human body. The right may be exercised only to the extent reasonably necessary to repel the attack. The right does not arise where there is enough time to seek the protection of public authorities, and it ends as soon as the danger to the body ends.

FACTS: Late at night, Arjun saw a man attacking an elderly stranger with a stick in a deserted lane. There was no police station nearby. Arjun pushed the attacker away, and the attacker fell and sprained his wrist. The attacker then dropped the stick and ran away. Arjun chased him for two streets, caught him and punched him several times.`,
  questions: [
    {
      text: "When Arjun pushed the attacker away, was he exercising the right of private defence?",
      a: "No, because the right exists only to protect one's own body.",
      b: "Yes, because the right extends to defending the body of any other person, and the push was reasonably necessary to repel the attack.",
      c: "No, because Arjun should have called the police first.",
      d: "No, because the attacker was injured.",
      correct: "b",
      explanation: "The principle expressly covers defending 'the body of any other person'. There was no time to seek help from the authorities in a deserted lane at night, and a push is proportionate to an attack with a stick. Injury caused by a proportionate response does not take away the right.",
    },
    {
      text: "Were the punches Arjun threw after catching the attacker protected by the right?",
      a: "Yes, because the attacker started the fight.",
      b: "Yes, because Arjun was still angry at what he had seen.",
      c: "No, because the danger to the body had ended when the attacker dropped the stick and fled, so the right had ended too.",
      d: "No, because Arjun was a stranger to the victim.",
      correct: "c",
      explanation: "The right ends as soon as the danger ends. After the attacker disarmed and ran away there was nothing left to repel. Punching him afterwards is retaliation, not defence. Option (d) is wrong because the right extends to protecting strangers.",
    },
    {
      text: "Which change to the facts would most clearly have taken away Arjun's right to push the attacker?",
      a: "The attack took place right outside a police station, with officers standing at the gate who could have stepped in at once.",
      b: "The victim was Arjun's neighbour.",
      c: "The attacker was carrying a knife instead of a stick.",
      d: "The attack happened in daylight.",
      correct: "a",
      explanation: "The right does not arise where there is enough time to seek protection from public authorities. Officers who could step in at once make that recourse available. Daylight alone (d) does not make police help available.",
    },
  ],
};

const SETS = [NEGLIGENCE, FREE_CONSENT, PRIVATE_DEFENCE];

const toQuestions = (c: Comprehension): SeedQuestion[] =>
  c.questions.map((q) => ({ ...q, subject: LR, passage: c.passage }));

// ── Topic notes ───────────────────────────────────────────────

type SeedTopic = { title: string; notes: string; durationMin?: number; test?: Comprehension; free?: boolean };
type SeedChapter = { title: string; topics: SeedTopic[] };
type SeedSubject = { slug: string; chapters: SeedChapter[] };

const SYLLABUS: SeedSubject[] = [
  {
    slug: "legal-reasoning",
    chapters: [
      {
        title: "Law of Torts",
        topics: [
          {
            title: "Negligence",
            free: true,
            test: NEGLIGENCE,
            notes: `What negligence is
Negligence is carelessness that the law makes you pay for. A claim succeeds only when all three elements are proved together.

1. Duty of care
You owe a duty to anyone you can reasonably foresee being harmed by your carelessness (the "neighbour" test from Donoghue v. Stevenson, 1932). Drivers owe it to passengers and pedestrians, doctors to patients, and shopkeepers to customers.

2. Breach of duty
You breach the duty when you fall below the standard of a reasonable person in the same situation. The test is objective: "I did my best" is no defence if a reasonable person would have done better.

3. Causation and damage
The breach must actually cause the harm. Ask: but for the breach, would the harm have happened? The harm must also not be too remote.

Exam traps
• Obeying one rule, such as the speed limit, does not prove reasonable care.
• No harm means no negligence claim, however careless the act.
• If the harm would have happened anyway, causation fails.
• Apply the principle given in the passage, even if it differs from the law you know.`,
          },
          {
            title: "Nuisance",
            notes: `Nuisance protects your use and enjoyment of your land or property.

Private nuisance
An unreasonable interference with a person's use or enjoyment of land, such as noise, smoke, smells or vibrations. The test is reasonableness: ordinary use of land in a normal way is not a nuisance, even if it disturbs a neighbour a little.

Public nuisance
An act that affects the public at large, such as blocking a public road. An individual can sue only if they suffered special damage beyond what the general public suffered.

Points to remember
• The sensitivity of the plaintiff matters. An unusually sensitive use (for example, a delicate trade) does not make ordinary activity a nuisance.
• "Coming to the nuisance" (moving next to an existing nuisance) is generally not a defence.
• It usually needs to be a continuing state of affairs, not a one-off event.`,
          },
          {
            title: "Defamation",
            notes: `Defamation is a false statement that harms a person's reputation in the eyes of right-thinking members of society.

Essentials
1. The statement is defamatory, meaning it lowers the person's reputation.
2. It refers to the plaintiff.
3. It is published, meaning communicated to at least one person other than the plaintiff.

Libel and slander
Libel is defamation in permanent form (writing, print, posts). Slander is defamation in spoken or transient form.

Defences
• Truth (justification): a true statement is not defamatory.
• Fair comment: honest opinion on a matter of public interest.
• Privilege: absolute (for example, statements in Parliament or court) or qualified (made in good faith with a duty to communicate).`,
          },
        ],
      },
      {
        title: "Law of Contract",
        topics: [
          {
            title: "Free Consent",
            test: FREE_CONSENT,
            notes: `An agreement is a contract only if the parties' consent is free. Consent is not free when it is caused by one of the following:

• Coercion: committing or threatening an unlawful act to force the agreement. The contract is voidable.
• Undue influence: a person in a position to dominate the other's will uses that position unfairly. The contract is voidable.
• Fraud: deliberate deception to induce the agreement. The contract is voidable.
• Misrepresentation: an innocent false statement. The contract is voidable.
• Mistake: a bilateral mistake of an essential fact makes the agreement void. A unilateral mistake usually does not.

Void and voidable
• A void agreement has no legal effect from the start, so nobody can enforce it.
• A voidable contract is valid until the aggrieved party chooses to cancel it. That party may also choose to affirm it.

Exam trap: a fair price does not cure coercion. What matters is whether the consent was free, not whether the deal was good.`,
          },
          {
            title: "Minor's Agreement",
            notes: `A minor (below 18 in India) is not competent to contract. An agreement with a minor is void ab initio, meaning void from the start (Mohori Bibee v. Dharmodas Ghose, 1903).

Consequences
• The minor cannot be sued on the agreement, and no estoppel operates against a minor.
• A minor cannot ratify the agreement on becoming a major.
• A minor can be a beneficiary, for example a promisee or payee.
• The minor's estate is liable for necessaries supplied to the minor (food, clothing, education suitable to their station in life), but the minor is not personally liable.

Exam trap: when the passage gives you its own principle, apply that principle, not these general rules.`,
          },
        ],
      },
      {
        title: "Criminal Law",
        topics: [
          {
            title: "Right of Private Defence",
            test: PRIVATE_DEFENCE,
            notes: `Everyone may defend their own body and property, and the body and property of others, against unlawful attack.

Limits
• Proportionality: use only as much force as is reasonably necessary.
• No time for authorities: the right does not arise if there is time to seek protection from public authorities.
• Duration: the right starts when a reasonable apprehension of danger arises and ends when the danger ends.
• No right against lawful acts, such as a public servant acting in good faith.

Exam traps
• Chasing and beating an attacker who has fled is retaliation, not defence.
• A stranger may defend a stranger.
• Injury caused by a proportionate response does not make the act unlawful.`,
          },
        ],
      },
    ],
  },
  {
    slug: "english",
    chapters: [
      {
        title: "Reading Comprehension",
        topics: [
          {
            title: "Finding the Main Idea",
            free: true,
            notes: `Almost every CLAT passage has a main-idea question. The main idea is the one claim the whole passage exists to support.

Method
1. Read the first and last paragraphs closely. Authors usually state their thesis there.
2. For each paragraph, write a 5-word summary in your head.
3. Ask: which single statement do all these paragraph summaries support?

Eliminating options
• Too narrow: true, but covers only one paragraph.
• Too broad: goes beyond what the passage discusses.
• Distorted: uses the passage's words but changes the meaning.
• Out of scope: sounds sensible but is not in the passage.`,
          },
          {
            title: "Tone and Inference",
            notes: `Tone
Tone is the author's attitude: critical, supportive, sceptical, neutral, ironic, and so on. Look for loaded words ("merely", "admittedly", "unfortunately") and for what the author does with the opposing view.
Extreme tones such as "furious" or "contemptuous" are rarely right in CLAT passages.

Inference
An inference must follow from the passage. It is not merely consistent with it.
• The right answer is usually a small, safe step beyond the text.
• Reject options that need outside knowledge or assumptions.
• If an option would be true only if something unstated were also true, it is not a valid inference.`,
          },
        ],
      },
    ],
  },
  {
    slug: "logical-reasoning",
    chapters: [
      {
        title: "Critical Reasoning",
        topics: [
          {
            title: "Assumptions",
            notes: `An assumption is an unstated premise the argument needs in order to work.

Negation test
Negate the option. If the argument falls apart, the option is a necessary assumption.

Example
"Sales rose after the ad campaign, so the campaign increased sales."
Assumption: nothing else, such as a festival season or a price cut, caused the rise.
Negate it: "Something else caused the rise." The argument collapses, so the option is an assumption.`,
          },
          {
            title: "Strengthen and Weaken",
            notes: `First find the conclusion and the evidence. Then look for the gap between them.

Strengthen: close the gap. Rule out an alternative cause, or add supporting evidence.
Weaken: widen the gap. Show an alternative cause, a flawed comparison, or unrepresentative data.

Traps
• Options that are about the topic but not about the argument.
• Options that repeat the evidence without adding anything.`,
          },
        ],
      },
    ],
  },
];

/** A paper keyed on its title, created once and reused on later runs. */
async function ensureTest(title: string, description: string, type: string, durationMin: number, questions: SeedQuestion[], authorId: string | null): Promise<string> {
  const found = await db.prepare("SELECT id FROM tests WHERE title = ?").get(title) as { id: string } | undefined;
  if (found) return found.id;
  const id = newId();
  await db.prepare(
    `INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by)
     VALUES (?, ?, ?, ?, NULL, ?, 'published', ?)`
  ).run(id, title, description, type, durationMin, authorId);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await db.prepare(
      `INSERT INTO questions (id, test_id, subject, passage, text, opt_a, opt_b, opt_c, opt_d, correct, explanation, order_idx)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(newId(), id, q.subject, q.passage ?? "", q.text, q.a, q.b, q.c, q.d, q.correct, q.explanation, i);
  }
  return id;
}

/** Seeds the comprehension test series and the starter syllabus. Idempotent per course. */
export async function seedDemoSyllabus(authorId: string | null): Promise<void> {
  // The full comprehension paper for the Test Series…
  await ensureTest(
    "Legal Reasoning — Comprehension Test 1",
    "3 comprehension passages (Torts, Contract, Criminal Law), each followed by 3 questions. Read the principle and facts once, then answer.",
    "sectional", 15,
    SETS.flatMap(toQuestions),
    authorId,
  );
  // …and one short comprehension test per topic.
  const topicTests = new Map<Comprehension, string>();
  for (const set of SETS) {
    topicTests.set(set, await ensureTest(
      `${set.topic} — Topic Test`,
      "One comprehension passage with 3 questions on this topic.",
      "practice", 0,
      toQuestions(set),
      authorId,
    ));
  }

  const subjects = await db.prepare("SELECT id, slug, name FROM subjects").all() as { id: string; slug: string; name: string }[];
  const courses = await db.prepare(
    "SELECT id FROM courses WHERE slug IN ('clat', 'clat-ailet', 'clat-online')"
  ).all() as { id: string }[];

  for (const course of courses) {
    // Only for courses nobody has built a syllabus for yet — admins' work wins.
    const has = await db.prepare("SELECT 1 FROM modules WHERE course_id = ?").get(course.id);
    if (has) continue;

    for (let si = 0; si < SYLLABUS.length; si++) {
      const subj = SYLLABUS[si];
      const subject = subjects.find((s) => s.slug === subj.slug);
      if (!subject) continue;
      const moduleId = newId();
      await db.prepare(
        "INSERT INTO modules (id, course_id, subject_id, title, description, sort_order) VALUES (?, ?, ?, ?, '', ?)"
      ).run(moduleId, course.id, subject.id, subject.name, si);

      for (let ci = 0; ci < subj.chapters.length; ci++) {
        const ch = subj.chapters[ci];
        const chapterId = newId();
        await db.prepare(
          "INSERT INTO chapters (id, module_id, title, description, sort_order) VALUES (?, ?, ?, '', ?)"
        ).run(chapterId, moduleId, ch.title, ci);

        for (let ti = 0; ti < ch.topics.length; ti++) {
          const t = ch.topics[ti];
          await db.prepare(
            `INSERT INTO lessons (id, chapter_id, title, type, body, video_url, notes_url, test_id, duration_min, is_free, sort_order)
             VALUES (?, ?, ?, 'topic', ?, '', '', ?, ?, ?, ?)`
          ).run(newId(), chapterId, t.title, t.notes, t.test ? topicTests.get(t.test) ?? null : null, t.durationMin ?? 0, t.free ? 1 : 0, ti);
        }
      }
    }
  }
}
