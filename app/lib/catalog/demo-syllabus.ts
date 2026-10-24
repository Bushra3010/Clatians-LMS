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
  {
    slug: "current-affairs",
    chapters: [
      {
        title: "Current Affairs & GK",
        topics: [
          {
            title: "How CLAT Tests Current Affairs",
            notes: `CLAT's current affairs section is a short passage (news report, editorial or government notice) followed by 4-5 questions — it tests whether you understood and remember the event, not whether you can recall a date in isolation.

What to focus on
• The "what happened" — the core fact of the event.
• The "who" — which court, ministry, company or country it involves.
• The "why it matters" — the legal, constitutional or economic angle, since CLAT leans legal.

What not to chase
Obscure one-line facts that appear in no other source. If three different weekly digests all cover a story, it is CLAT-relevant; if only one obscure source mentions it, it probably is not.`,
          },
          {
            title: "Building a Daily Current Affairs Habit",
            notes: `Current affairs is a habit subject, not a cramming subject — a year's worth of headlines cannot be memorised in the last week.

A simple routine
1. Read one trusted daily digest for 15-20 minutes, every day, at the same time.
2. Note Supreme Court and High Court judgments separately — CLAT weights legal current affairs heavily.
3. Revise the week's notes every Sunday in 10 minutes, out loud or by writing one line per story.
4. Re-read the last three months' notes once a month, so nothing from earlier in the year is forgotten.

This batch's monthly current affairs magazine and the Current Affairs tool under Free Resources follow the same routine — use them as your daily digest.`,
          },
        ],
      },
    ],
  },
];

// ── Demo depth (v3) ───────────────────────────────────────────
// More chapters and topics per subject, with durations, so every subject in a
// batch has a real chapter list to open. Merged into SYLLABUS by title: a
// chapter that already exists gets the extra topics appended.

/** Minutes per topic, for the starter topics above that had none. */
const DURATIONS: Record<string, number> = {
  "Negligence": 22, "Nuisance": 18, "Defamation": 20,
  "Free Consent": 20, "Minor's Agreement": 16, "Right of Private Defence": 22,
  "Finding the Main Idea": 18, "Tone and Inference": 20,
  "Assumptions": 18, "Strengthen and Weaken": 20,
  "How CLAT Tests Current Affairs": 15, "Building a Daily Current Affairs Habit": 12,
};

const EXTRA: SeedSubject[] = [
  {
    slug: "english",
    chapters: [
      { title: "Reading Comprehension", topics: [
        { title: "Author's Purpose", durationMin: 15, notes: `Ask why the author wrote the passage: to inform, to argue, to criticise or to describe.\n\nClues\n• Opinion words (should, must, unfortunately) point to an argument.\n• Neutral, data-heavy writing points to informing.\n\nCLAT options often swap "criticise" for "describe" — check the tone before you pick.` },
      ] },
      { title: "Vocabulary in Context", topics: [
        { title: "Using Context Clues", durationMin: 15, notes: `You rarely need the dictionary meaning — you need the meaning in this sentence.\n\nLook at\n• Definitions or examples right after the word.\n• Contrast words (but, however) that flip the meaning.\n• The overall tone of the paragraph.` },
        { title: "Commonly Confused Words", durationMin: 12, notes: `Pairs CLAT likes to test:\n• affect (verb) / effect (noun)\n• principle (rule) / principal (main, or head of a school)\n• complement (complete) / compliment (praise)\n• stationary (not moving) / stationery (paper, pens)\n\nSay the sentence with each option — the right one usually sounds natural.` },
        { title: "Idioms and Phrases", durationMin: 14, notes: `Idioms mean something different from their words.\n\nExamples\n• "Bite the bullet" — face something unpleasant bravely.\n• "At the eleventh hour" — at the last moment.\n• "Turn a blind eye" — deliberately ignore.\n\nIn a passage, read the sentences around the idiom; the context usually gives the meaning away.` },
      ] },
      { title: "Grammar for CLAT", topics: [
        { title: "Subject-Verb Agreement", durationMin: 16, notes: `A singular subject takes a singular verb; a plural subject takes a plural verb.\n\nTraps\n• Words between subject and verb don't change it: "The list of items is long."\n• "Each", "every", "either", "neither" are singular.\n• "The number of" is singular; "a number of" is plural.` },
        { title: "Tenses and Sequence", durationMin: 18, notes: `Keep tenses consistent unless the time actually changes.\n\n• Past perfect (had done) shows the earlier of two past actions.\n• After "if" in a future condition, use present: "If it rains, we will stay."\n• Reported speech usually shifts one tense back.` },
        { title: "Sentence Correction Strategy", durationMin: 20, notes: `1. Read the whole sentence and find the subject and main verb.\n2. Check agreement, tense, pronoun reference and parallelism.\n3. Eliminate options that change the meaning.\n4. Between two correct options, prefer the shorter, clearer one.` },
      ] },
    ],
  },
  {
    slug: "legal-reasoning",
    chapters: [
      { title: "Law of Contract", topics: [
        { title: "Consideration", durationMin: 18, notes: `Consideration is "something in return" — a promise, act or forbearance given for the other side's promise.\n\nKey points\n• It must move at the desire of the promisor.\n• It need not be adequate, only real.\n• Past consideration is valid in Indian law (Section 2(d), Indian Contract Act).` },
      ] },
      { title: "Criminal Law", topics: [
        { title: "General Exceptions", durationMin: 20, notes: `The IPC's general exceptions remove criminal liability in set situations.\n\nCommon ones\n• Mistake of fact in good faith.\n• Accident in doing a lawful act.\n• Acts of a child below seven.\n• Insanity that prevents knowing the nature of the act.\n\nIn a CLAT passage, apply only the exception the principle gives you.` },
        { title: "Abetment", durationMin: 15, notes: `Abetment is helping or encouraging someone else to commit an offence.\n\nThree ways\n• Instigating the person.\n• Joining a conspiracy for it.\n• Intentionally aiding it.\n\nThe abettor can be liable even if the main offence is not completed.` },
      ] },
      { title: "Constitutional Law", topics: [
        { title: "Fundamental Rights", durationMin: 25, notes: `Part III of the Constitution (Articles 12–35) guarantees fundamental rights against the State.\n\nThe six groups\n• Equality (14–18) • Freedom (19–22) • Against exploitation (23–24)\n• Religion (25–28) • Cultural and educational (29–30) • Constitutional remedies (32)\n\nArticle 32 lets a citizen go straight to the Supreme Court when these are violated.` },
        { title: "Directive Principles", durationMin: 18, notes: `Part IV (Articles 36–51) lists goals the State should follow when making laws — for example equal pay, free legal aid and a uniform civil code.\n\nThey are not enforceable in court, but courts read them together with fundamental rights to interpret laws.` },
        { title: "Writs", durationMin: 20, notes: `Courts issue writs to enforce rights.\n\n• Habeas corpus — produce the detained person.\n• Mandamus — perform a public duty.\n• Prohibition — a lower court must stop a case beyond its power.\n• Certiorari — quash a lower court's order.\n• Quo warranto — by what authority a person holds a public office.` },
      ] },
    ],
  },
  {
    slug: "logical-reasoning",
    chapters: [
      { title: "Critical Reasoning", topics: [
        { title: "Inference", durationMin: 16, notes: `An inference must be true based only on the passage — not probably true, not true in real life.\n\nEliminate options that\n• Go beyond what is stated.\n• Use extreme words (always, never) the passage doesn't support.\n• Repeat a fact without drawing anything from it.` },
      ] },
      { title: "Analytical Reasoning", topics: [
        { title: "Seating Arrangement", durationMin: 25, notes: `Draw the arrangement first; don't solve in your head.\n\n1. Fix the most definite clue (a named seat or an end position).\n2. Add clues that link to people already placed.\n3. Keep two diagrams when a clue allows two cases, and drop one when a later clue breaks it.` },
        { title: "Blood Relations", durationMin: 18, notes: `Draw a family tree with symbols: + for male, – for female, a horizontal line for a married couple and a vertical line for parent to child.\n\nRead the relation from the last person named back to the first.` },
        { title: "Direction Sense", durationMin: 15, notes: `Mark North at the top and track every turn on paper.\n\n• Right turn when facing North means facing East.\n• Shortest distance between start and end uses Pythagoras: √(x² + y²).` },
      ] },
      { title: "Syllogisms", topics: [
        { title: "Basics of Syllogism", durationMin: 16, notes: `Two statements, one conclusion. Treat statements as true even if they sound absurd.\n\nUse Venn diagrams: draw the least overlap the statements allow. A conclusion follows only if it is true in every possible diagram.` },
        { title: "Possibility Cases", durationMin: 18, notes: `"Some A can be B" is a possibility conclusion. It follows if at least one valid diagram allows it and no statement rules it out.\n\nDon't confuse "can be" (possible) with "is" (definite).` },
      ] },
    ],
  },
  {
    slug: "current-affairs",
    chapters: [
      { title: "Legal Current Affairs", topics: [
        { title: "Reading a Supreme Court Judgment", durationMin: 20, notes: `For CLAT, note four things about a judgment: the parties, the question of law, the decision and the reason.\n\nThe bench size matters too — a larger bench's ruling binds a smaller one.` },
        { title: "Bills and Acts", durationMin: 15, notes: `A bill becomes an Act after both Houses pass it and the President gives assent.\n\nFor each new law, note: what it replaces, the key change it makes, and which ministry pushed it.` },
      ] },
      { title: "Static GK", topics: [
        { title: "Indian Polity Basics", durationMin: 18, notes: `Know the structure: President, Parliament (Lok Sabha and Rajya Sabha), Council of Ministers, Supreme Court and High Courts, Election Commission and the CAG.\n\nCLAT asks who appoints whom and which article creates each office.` },
        { title: "International Organisations", durationMin: 16, notes: `For each body, learn headquarters, head and purpose: UN (New York), WHO (Geneva), WTO (Geneva), IMF and World Bank (Washington DC), ICJ (The Hague).\n\nPair this with any recent news involving the body.` },
      ] },
    ],
  },
  {
    slug: "quantitative",
    chapters: [
      { title: "Arithmetic Basics", topics: [
        { title: "Percentages", durationMin: 20, notes: `x% of y = (x × y) / 100.\n\nShortcuts\n• Increase by r% then decrease by r% gives a net loss of r²/100 %.\n• Percentage change = (new − old) / old × 100.` },
        { title: "Ratio and Proportion", durationMin: 18, notes: `A ratio a : b compares two quantities of the same kind.\n\nIf a total T is split in a : b, the shares are T × a/(a+b) and T × b/(a+b).\nFour numbers are in proportion when a/b = c/d.` },
        { title: "Averages", durationMin: 15, notes: `Average = sum of values ÷ number of values.\n\nIf one value is replaced, the new average changes by (new value − old value) ÷ count.` },
      ] },
      { title: "Data Interpretation", topics: [
        { title: "Reading Tables", durationMin: 18, notes: `Read the title, the units and the row and column labels before any question.\n\nApproximate first; calculate exactly only when two options are close.` },
        { title: "Bar and Pie Charts", durationMin: 20, notes: `In a pie chart, each slice is a share of 360°: share % = angle ÷ 360 × 100.\n\nFor bar charts, compare heights first and read exact values only when the question needs them.` },
      ] },
    ],
  },
];

/** SYLLABUS with the v3 depth merged in, in the exam's section order. */
function fullSyllabus(): SeedSubject[] {
  const order = ["english", "current-affairs", "legal-reasoning", "logical-reasoning", "quantitative"];
  const merged: SeedSubject[] = SYLLABUS.map((s) => ({
    slug: s.slug,
    chapters: s.chapters.map((c) => ({ title: c.title, topics: c.topics.map((t) => ({ ...t, durationMin: t.durationMin ?? DURATIONS[t.title] })) })),
  }));
  for (const extra of EXTRA) {
    let subj = merged.find((s) => s.slug === extra.slug);
    if (!subj) { subj = { slug: extra.slug, chapters: [] }; merged.push(subj); }
    for (const ch of extra.chapters) {
      const existing = subj.chapters.find((c) => c.title === ch.title);
      if (existing) existing.topics.push(...ch.topics);
      else subj.chapters.push(ch);
    }
  }
  return merged.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

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

  // Find-or-create at every level (module → chapter → topic), so later runs
  // only add what is missing and never duplicate or overwrite admins' work.
  // The one update: a starter topic with no duration gets the demo duration.
  const syllabus = fullSyllabus();
  for (const course of courses) {
    for (let si = 0; si < syllabus.length; si++) {
      const subj = syllabus[si];
      const subject = subjects.find((s) => s.slug === subj.slug);
      if (!subject) continue;
      let mod = await db.prepare("SELECT id FROM modules WHERE course_id = ? AND subject_id = ? ORDER BY sort_order LIMIT 1").get(course.id, subject.id) as { id: string } | undefined;
      if (!mod) {
        mod = { id: newId() };
        await db.prepare(
          "INSERT INTO modules (id, course_id, subject_id, title, description, sort_order) VALUES (?, ?, ?, ?, '', ?)"
        ).run(mod.id, course.id, subject.id, subject.name, si);
      }

      for (let ci = 0; ci < subj.chapters.length; ci++) {
        const ch = subj.chapters[ci];
        let chapter = await db.prepare("SELECT id FROM chapters WHERE module_id = ? AND title = ?").get(mod.id, ch.title) as { id: string } | undefined;
        if (!chapter) {
          chapter = { id: newId() };
          await db.prepare(
            "INSERT INTO chapters (id, module_id, title, description, sort_order) VALUES (?, ?, ?, '', ?)"
          ).run(chapter.id, mod.id, ch.title, ci);
        }

        for (let ti = 0; ti < ch.topics.length; ti++) {
          const t = ch.topics[ti];
          const lesson = await db.prepare("SELECT id, duration_min FROM lessons WHERE chapter_id = ? AND title = ?").get(chapter.id, t.title) as { id: string; duration_min: number } | undefined;
          if (lesson) {
            if (!lesson.duration_min && t.durationMin) {
              await db.prepare("UPDATE lessons SET duration_min = ? WHERE id = ?").run(t.durationMin, lesson.id);
            }
            continue;
          }
          await db.prepare(
            `INSERT INTO lessons (id, chapter_id, title, type, body, video_url, notes_url, test_id, duration_min, is_free, sort_order)
             VALUES (?, ?, ?, 'topic', ?, '', '', ?, ?, ?, ?)`
          ).run(newId(), chapter.id, t.title, t.notes, t.test ? topicTests.get(t.test) ?? null : null, t.durationMin ?? 0, t.free ? 1 : 0, ti);
        }
      }
    }
  }
}
