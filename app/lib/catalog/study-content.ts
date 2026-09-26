// ─────────────────────────────────────────────────────────────
// The CLAT study material the app ships with: notes, current-affairs
// digests, section practice papers and the Mock Test Series papers.
//
// Everything here is written against the CLAT UG pattern in force since 2020 —
// passage-led questions across English, Current Affairs & GK, Legal Reasoning,
// Logical Reasoning and Quantitative Techniques.
//
// This is a starting library, not a fixed one: admins edit, replace or delete
// any of it from the admin panel, and seedStudyContent() never overwrites a
// row once it exists.
// ─────────────────────────────────────────────────────────────

export type SeedQuestion = {
  subject: string;
  /** Shared stimulus for a run of questions — blank for standalone ones. */
  passage?: string;
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
  explanation: string;
};

export type SeedPaper = {
  title: string;
  description: string;
  type: "practice" | "mock";
  /** 0 = untimed. Practice papers are untimed; mocks run on the clock. */
  durationMin: number;
  /** Slug of the course this belongs to; null = available to every student. */
  courseSlug: string | null;
  questions: SeedQuestion[];
};

export type SeedNote = {
  title: string;
  type: "notes" | "current-affairs";
  body: string;
};

// ── Passages reused across a paper's questions ───────────────

const TORT_PRINCIPLE = `PRINCIPLE: A person is liable in negligence when three things are shown together — that they owed the injured person a duty of care, that they breached that duty, and that the breach caused the injury complained of. A duty of care is owed to anyone the person can reasonably foresee being injured by their carelessness.

FACTS: Meera runs a sweet shop. She mopped the floor at 5 p.m. and went to the back room without putting up a warning sign. At 5:10 p.m. Anil walked in, slipped on the wet floor and fractured his wrist.`;

const CONTRACT_PRINCIPLE = `PRINCIPLE: An agreement becomes a contract only when it is made by free consent of parties competent to contract, for a lawful consideration and with a lawful object. Consent is not free when it is caused by coercion, undue influence, fraud, misrepresentation or mistake. An agreement whose consent was caused by coercion is voidable at the option of the party whose consent was so caused.

FACTS: Rohit owed money to a moneylender, Kishan. Kishan came to Rohit's house with four men, blocked the door and said none of them would leave until Rohit signed a paper selling his motorcycle for ₹5,000 — about a fifth of what it was worth. Rohit signed. The next morning Rohit went to a lawyer.`;

const RC_PASSAGE = `The idea that a court should be the final word on what a constitution means is younger than the idea of a constitution itself. For much of the nineteenth century, it was parliaments — not judges — that were treated as the guardians of a nation's founding text. The reasoning was simple, and democratic: legislators are elected and can be removed, while judges are appointed and are not.

What changed the argument was not a new theory but an accumulation of experience. Majorities, it turned out, could be careless with the rights of people who were not in the majority, and a legislature asked to police its own excesses rarely found much to police. The case for judicial review therefore rests less on the claim that judges are wiser than legislators than on the claim that they are differently situated: a judge deciding a single case, bound to give reasons, and insulated from the next election, is structurally freer to say that a popular law is nonetheless an impermissible one.

This is a modest defence, and it carries its own warning. If the value of review lies in the giving of reasons, then a court that decides without reasoning — or that reasons only to reach a result it had already chosen — forfeits the very thing that justifies it. The authority of a constitutional court is not conferred once and held forever; it is re-earned, or squandered, judgment by judgment.`;

// ── Practice papers — one per CLAT section, untimed ──────────

const LEGAL_REASONING_PRACTICE: SeedPaper = {
  title: "Legal Reasoning — Practice Set 1: Negligence & Consent",
  description: "Two principle-and-facts sets on tort and contract. Apply only the principle given — not the real law.",
  type: "practice",
  durationMin: 0,
  courseSlug: null,
  questions: [
    {
      subject: "Legal Reasoning",
      passage: TORT_PRINCIPLE,
      text: "Is Meera liable to Anil in negligence?",
      a: "No, because Anil should have watched where he was walking",
      b: "Yes, because all three elements — duty, breach and causation — are made out",
      c: "No, because Meera did not intend to hurt anyone",
      d: "Yes, but only if Meera had been warned about the floor before",
      correct: "b",
      explanation:
        "Work through the three elements the principle names. Duty: a shopkeeper can reasonably foresee that customers will walk on her floor, so a duty is owed to Anil. Breach: mopping and leaving without a warning sign falls short of the care that duty requires. Causation: the fracture came from slipping on that wet floor. All three are present, so the principle makes her liable. (a) and (c) add conditions the principle never mentions — contributory carelessness and intention are irrelevant here. (d) invents a prior-warning requirement.",
    },
    {
      subject: "Legal Reasoning",
      passage: TORT_PRINCIPLE,
      text: "Suppose instead that Anil had climbed over the shop's locked shutter at 11 p.m. and slipped. Applying the same principle, is Meera liable?",
      a: "Yes, the floor was still wet, so the breach continues",
      b: "Yes, a shopkeeper is always liable for injuries on her premises",
      c: "No, because a trespasser entering a locked shop at night is not reasonably foreseeable",
      d: "No, because the injury happened outside business hours",
      correct: "c",
      explanation:
        "The principle limits the duty to people the defendant can 'reasonably foresee being injured by their carelessness'. Someone climbing over a locked shutter at night is not such a person, so the first element fails and the rest never arises. (a) misses that a breach without a duty is not negligence. (b) states a strict liability the principle does not create. (d) is close to the right answer but rests on the wrong reason — the hour matters only because it bears on foreseeability, not by itself.",
    },
    {
      subject: "Legal Reasoning",
      passage: CONTRACT_PRINCIPLE,
      text: "What is the legal position of the sale of the motorcycle?",
      a: "It is void from the beginning and has no effect",
      b: "It is valid, since Rohit signed it himself",
      c: "It is voidable at Rohit's option",
      d: "It is valid, because the debt owed to Kishan was lawful consideration",
      correct: "c",
      explanation:
        "Confining the men to the house until Rohit signed is coercion, so Rohit's consent was not free. The principle spells out the consequence precisely: such an agreement is 'voidable at the option of the party whose consent was so caused' — Rohit may set it aside, or let it stand. (a) confuses voidable with void; the difference is exactly who gets to choose. (b) treats a signature as proof of free consent, which the principle denies. (d) answers a different element — lawful consideration cannot cure unfree consent.",
    },
    {
      subject: "Legal Reasoning",
      passage: CONTRACT_PRINCIPLE,
      text: "If Rohit instead takes the ₹5,000, rides the motorcycle to Kishan's house and hands over the keys, what is the most likely legal effect?",
      a: "The agreement stays voidable indefinitely",
      b: "Rohit has affirmed the agreement, and it stands",
      c: "The agreement becomes void from the beginning",
      d: "Kishan may now cancel the agreement",
      correct: "b",
      explanation:
        "Voidable means one party holds a choice. Performing the agreement with knowledge of the coercion is how that choice is exercised in favour of keeping it — Rohit elects to affirm, and the agreement stands. (a) ignores that an option, once exercised, is spent. (c) again confuses voidable with void. (d) misreads who holds the option: it belongs to the coerced party, never to the one who applied the coercion.",
    },
    {
      subject: "Legal Reasoning",
      text: "PRINCIPLE: Whoever, intending to take dishonestly any movable property out of the possession of any person without that person's consent, moves that property, commits theft.\n\nFACTS: Sameer picks up his colleague Divya's umbrella from the office stand, believing it is his own identical umbrella, and walks home with it.",
      a: "Sameer has committed theft because he moved Divya's property without her consent",
      b: "Sameer has not committed theft because he lacked a dishonest intention",
      c: "Sameer has committed theft because an umbrella is movable property",
      d: "Sameer has not committed theft because he can return the umbrella",
      correct: "b",
      explanation:
        "The principle stacks several requirements, and every one must hold. Moving movable property out of another's possession without consent is satisfied here — but the intention to take *dishonestly* is not: Sameer believed the umbrella was his. One missing element defeats the whole. (a) and (c) each seize on a single satisfied element and stop there, which is the most common error in this question type. (d) adds a return-the-goods defence the principle does not contain.",
    },
  ],
};

const ENGLISH_PRACTICE: SeedPaper = {
  title: "English — Practice Set 1: Reading Comprehension",
  description: "One CLAT-length passage with inference, tone and vocabulary questions.",
  type: "practice",
  durationMin: 0,
  courseSlug: null,
  questions: [
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "Which of the following best captures the central argument of the passage?",
      a: "Judges understand constitutions better than legislators do",
      b: "Judicial review is justified by the position judges occupy rather than by superior wisdom, and must be continually re-earned through reasoning",
      c: "Parliaments were the original guardians of constitutions and should be restored to that role",
      d: "Constitutional courts in the nineteenth century were weaker than they are today",
      correct: "b",
      explanation:
        "The second paragraph states the defence — judges are 'differently situated', not wiser — and the third adds the condition that a court which does not truly reason 'forfeits the very thing that justifies it'. (b) holds both halves together. (a) is precisely what the author denies. (c) reports the nineteenth-century view as the author's own conclusion, which it is not. (d) is a historical detail, not the argument.",
    },
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "The author describes the defence of judicial review as 'modest' primarily because it",
      a: "applies only to small constitutional questions",
      b: "was accepted slowly over the nineteenth century",
      c: "claims less for judges than a claim of superior wisdom would",
      d: "concedes that judicial review will eventually be abandoned",
      correct: "c",
      explanation:
        "'Modest' is doing comparative work: the author has just rejected the stronger claim that judges are wiser, and settles for the weaker structural one. The defence is modest in what it asserts. (a) reads 'modest' as being about the size of cases. (b) attaches it to the pace of historical change. (d) invents a prediction the passage never makes.",
    },
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "'Insulated from the next election' is used in the passage to suggest that a judge is",
      a: "indifferent to public opinion on every subject",
      b: "free from the pressure of having to please a current majority",
      c: "unable to understand what voters want",
      d: "protected by law from criticism of judgments",
      correct: "b",
      explanation:
        "The phrase sits in a list of structural features — deciding one case, giving reasons, no election ahead — that together leave a judge 'structurally freer to say that a popular law is nonetheless an impermissible one'. Freedom from majority pressure is exactly the point. (a) overstates it into total indifference. (c) turns a freedom into an incapacity. (d) imports a legal immunity the passage does not mention.",
    },
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "The tone of the final paragraph is best described as",
      a: "cautionary",
      b: "triumphant",
      c: "sardonic",
      d: "indifferent",
      correct: "a",
      explanation:
        "The paragraph opens by calling the defence modest, says it 'carries its own warning', and closes on authority being 'squandered, judgment by judgment'. That is a warning delivered evenly — cautionary. (b) is the opposite mood. (c) requires mockery, which is absent. (d) is ruled out by how invested the writing plainly is.",
    },
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "Which statement would the author be most likely to agree with?",
      a: "A constitutional court that gives no reasons weakens its own claim to authority",
      b: "The authority of a constitutional court, once established, is permanent",
      c: "Legislatures are generally effective at checking their own excesses",
      d: "Judicial review should be decided by referendum",
      correct: "a",
      explanation:
        "This is a restatement of the passage's closing move: reasons are what justify review, so a court that does not reason forfeits its justification. (b) directly contradicts 'not conferred once and held forever'. (c) contradicts 'a legislature asked to police its own excesses rarely found much to police'. (d) is outside the passage altogether — a plausible-sounding idea that is never raised.",
    },
  ],
};

const LOGICAL_PRACTICE: SeedPaper = {
  title: "Logical Reasoning — Practice Set 1: Assumptions & Inference",
  description: "Assumption, weakening, and conclusion questions in the CLAT critical-reasoning format.",
  type: "practice",
  durationMin: 0,
  courseSlug: null,
  questions: [
    {
      subject: "Logical Reasoning",
      text: "A city council argues: 'Road accidents fell 30% in the year after we installed speed cameras. The cameras are working and we should install more.'\n\nWhich of the following, if true, most weakens the argument?",
      a: "The cameras were expensive to install",
      b: "In the same year, the city closed its two busiest roads for repairs, cutting total traffic by half",
      c: "A neighbouring city has no speed cameras",
      d: "Some drivers slow down only where a camera is visible",
      correct: "b",
      explanation:
        "The argument treats the cameras as the cause of the fall. An alternative cause that would produce the same fall on its own is the strongest weakener — halving the traffic does exactly that. (a) attacks cost, not the causal claim. (c) gives no comparative outcome, so it tells us nothing. (d) is tempting because it sounds critical, but partial compliance still reduces accidents; it limits the effect rather than explaining it away.",
    },
    {
      subject: "Logical Reasoning",
      text: "'Every student who scored above 90 in the mock had completed all the practice sets. Nikhil completed all the practice sets.'\n\nWhich conclusion follows?",
      a: "Nikhil scored above 90",
      b: "Nikhil did not score above 90",
      c: "Nothing certain about Nikhil's score follows",
      d: "Nikhil scored exactly 90",
      correct: "c",
      explanation:
        "The statement runs one way only: scoring above 90 implies having completed the sets. It does not say completing the sets implies scoring above 90 — other students may have completed them and scored lower. Nikhil satisfies the consequent, which tells us nothing about the antecedent. (a) is the classic converse error. (b) inverts it in the other direction. (d) invents a precise figure from nothing.",
    },
    {
      subject: "Logical Reasoning",
      text: "An editorial claims: 'Since the new labour code came into force, formal-sector hiring has risen. The code should therefore be extended to agriculture.'\n\nThe argument assumes that",
      a: "agriculture currently has no labour regulation",
      b: "the conditions that made the code work in the formal sector also hold in agriculture",
      c: "formal-sector hiring will keep rising",
      d: "farmers have asked for the code",
      correct: "b",
      explanation:
        "Extending a measure from one setting to another only follows if the two settings are relevantly alike — that is the unstated bridge the conclusion rests on, and denying it collapses the argument. (a) may or may not be true and is not needed. (c) concerns the formal sector's future, not the transfer. (d) adds a political precondition the argument never relies on.",
    },
    {
      subject: "Logical Reasoning",
      text: "In a queue, Reena is 12th from the front and 18th from the back. How many people are in the queue?",
      a: "29",
      b: "30",
      c: "31",
      d: "28",
      correct: "a",
      explanation:
        "Adding the two positions counts Reena in both, so subtract the double count: 12 + 18 − 1 = 29. (b) is the answer you get by forgetting to subtract — the single most common slip in this question type. (c) and (d) do not follow from any consistent method.",
    },
    {
      subject: "Logical Reasoning",
      text: "'No lawyer in this firm has failed the bar exam. Some lawyers in this firm studied at NLU Delhi.'\n\nWhich must be true?",
      a: "Everyone who studied at NLU Delhi passed the bar exam",
      b: "Some people who studied at NLU Delhi have not failed the bar exam",
      c: "All lawyers in the firm studied at NLU Delhi",
      d: "No NLU Delhi graduate has ever failed the bar exam",
      correct: "b",
      explanation:
        "The overlap is what is certain: those firm lawyers who studied at NLU Delhi are, being firm lawyers, among the people who have not failed. That is exactly (b). (a) and (d) generalise from the firm's lawyers to all NLU Delhi students, whom the statements say nothing about. (c) converts 'some' into 'all'.",
    },
  ],
};

const QUANT_PRACTICE: SeedPaper = {
  title: "Quantitative Techniques — Practice Set 1: Percentages & Ratios",
  description: "Data-led arithmetic in the CLAT pattern — percentages, averages, ratios and profit & loss.",
  type: "practice",
  durationMin: 0,
  courseSlug: null,
  questions: [
    {
      subject: "Quantitative",
      text: "A coaching centre had 1,200 students last year and 1,380 this year. What is the percentage increase?",
      a: "12%",
      b: "15%",
      c: "18%",
      d: "13.5%",
      correct: "b",
      explanation:
        "Increase = 1,380 − 1,200 = 180. Percentage increase is always taken on the original value: 180/1200 = 0.15 = 15%. (a) and (c) do not arise from the figures. (d) comes from dividing by the new value (180/1380 ≈ 13%) — always divide by the starting number.",
    },
    {
      subject: "Quantitative",
      text: "A shopkeeper buys a book for ₹250 and sells it at a 20% profit. A second shopkeeper buys the same book for ₹300 and sells it at a 10% profit. What is the difference in their selling prices?",
      a: "₹30",
      b: "₹20",
      c: "₹40",
      d: "₹10",
      correct: "a",
      explanation:
        "Compute each selling price from its own cost price. First: 250 × 1.20 = ₹300. Second: 300 × 1.10 = ₹330. Difference = 330 − 300 = ₹30. The trap is to compare the percentages (20% against 10%) and conclude the first shopkeeper charges more — profit percentages are taken on different cost prices, so they are not comparable directly.",
    },
    {
      subject: "Quantitative",
      text: "The average score of 5 students is 72. If a sixth student scores 90, what is the new average?",
      a: "75",
      b: "74",
      c: "76",
      d: "78",
      correct: "a",
      explanation:
        "Work with totals, never with averages directly. Existing total = 5 × 72 = 360. New total = 360 + 90 = 450. New average = 450/6 = 75. (b), (c) and (d) come from averaging the averages or mis-dividing — both common shortcuts that fail here.",
    },
    {
      subject: "Quantitative",
      text: "In a batch, the ratio of students taking Legal Reasoning to those taking Logical Reasoning is 5:3. If 160 students take Legal Reasoning, how many take Logical Reasoning?",
      a: "96",
      b: "108",
      c: "120",
      d: "80",
      correct: "a",
      explanation:
        "Find the value of one ratio part: 160 ÷ 5 = 32 students per part. Logical Reasoning is 3 parts: 3 × 32 = 96. (c) would be the answer if the ratio were 4:3; (d) halves the wrong figure; (b) follows from no consistent method.",
    },
    {
      subject: "Quantitative",
      text: "A test has 150 questions. Each correct answer earns 1 mark and each wrong answer loses 0.25. A student attempts 120 questions and scores 90. How many did she get right?",
      a: "96",
      b: "100",
      c: "104",
      d: "108",
      correct: "a",
      explanation:
        "Let correct = x, so wrong = 120 − x. Then x − 0.25(120 − x) = 90 → x − 30 + 0.25x = 90 → 1.25x = 120 → x = 96. Check: 96 correct, 24 wrong, 96 − 6 = 90. ✓ The unattempted 30 questions never enter the equation — only attempts can be wrong, which is the trap in negative-marking sums.",
    },
  ],
};

const GK_PRACTICE: SeedPaper = {
  title: "Current Affairs & GK — Practice Set 1: Constitution & Polity",
  description: "Static polity and constitutional GK in the CLAT pattern.",
  type: "practice",
  durationMin: 0,
  courseSlug: null,
  questions: [
    {
      subject: "GK & Current Affairs",
      text: "Which Article of the Constitution of India guarantees the right to life and personal liberty?",
      a: "Article 19",
      b: "Article 21",
      c: "Article 14",
      d: "Article 32",
      correct: "b",
      explanation:
        "Article 21 provides that no person shall be deprived of life or personal liberty except according to procedure established by law. Its reach has widened enormously through interpretation — privacy, a clean environment, livelihood and a speedy trial have all been read into it. Article 19 covers the six freedoms, Article 14 equality before the law, and Article 32 the right to move the Supreme Court to enforce fundamental rights.",
    },
    {
      subject: "GK & Current Affairs",
      text: "The words 'Socialist' and 'Secular' were added to the Preamble of the Indian Constitution by which Amendment Act?",
      a: "24th Amendment",
      b: "42nd Amendment",
      c: "44th Amendment",
      d: "52nd Amendment",
      correct: "b",
      explanation:
        "The 42nd Amendment Act, 1976 — often called the 'Mini Constitution' for how much it altered — inserted 'Socialist', 'Secular' and 'Integrity' into the Preamble. The 44th Amendment (1978) reversed several of its other changes, notably moving the right to property out of Part III, but left these Preamble words in place.",
    },
    {
      subject: "GK & Current Affairs",
      text: "Which case established the 'basic structure' doctrine in Indian constitutional law?",
      a: "Kesavananda Bharati v. State of Kerala (1973)",
      b: "Golaknath v. State of Punjab (1967)",
      c: "Minerva Mills v. Union of India (1980)",
      d: "Maneka Gandhi v. Union of India (1978)",
      correct: "a",
      explanation:
        "Kesavananda Bharati held that Parliament's amending power under Article 368 is wide but cannot be used to damage or destroy the Constitution's basic structure. Golaknath had earlier taken the stricter line that fundamental rights could not be amended at all, and was overruled. Minerva Mills applied and strengthened the basic-structure doctrine rather than creating it; Maneka Gandhi transformed Article 21 but is not a basic-structure case.",
    },
    {
      subject: "GK & Current Affairs",
      text: "How many National Law Universities participate in the Common Law Admission Test (CLAT)?",
      a: "21",
      b: "22",
      c: "23",
      d: "25",
      correct: "c",
      explanation:
        "23 NLUs admit through CLAT, conducted by the Consortium of National Law Universities. NLU Delhi is the well-known exception — it runs its own entrance test, AILET — so it is not counted among the 23.",
    },
    {
      subject: "GK & Current Affairs",
      text: "Under the Constitution of India, who administers the oath of office to the President?",
      a: "The Prime Minister",
      b: "The Chief Justice of India",
      c: "The Vice-President",
      d: "The Speaker of the Lok Sabha",
      correct: "b",
      explanation:
        "Article 60 provides that the oath is administered by the Chief Justice of India, and in their absence by the senior-most available judge of the Supreme Court. The President in turn administers the oath to the Prime Minister and other ministers — a useful pairing to remember, since the two are easy to swap under exam pressure.",
    },
  ],
};

// ── Mock Test Series — the paid product ──────────────────────

const MOCK_1: SeedPaper = {
  title: "CLAT Mock Test 1 — Sectional Sampler",
  description: "A timed sampler across all five CLAT sections, in exam order.",
  type: "mock",
  durationMin: 30,
  courseSlug: "mock-tests",
  questions: [
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "According to the passage, the nineteenth-century preference for parliaments over courts rested on",
      a: "the belief that legislators were better lawyers",
      b: "a democratic argument about accountability",
      c: "the absence of written constitutions at the time",
      d: "the small size of early courts",
      correct: "b",
      explanation:
        "The passage gives the reason explicitly and calls it 'simple, and democratic': legislators are elected and removable, judges are appointed and are not. That is an accountability argument. (a), (c) and (d) are never claimed anywhere in the passage.",
    },
    {
      subject: "English",
      passage: RC_PASSAGE,
      text: "'Accumulation of experience' in the second paragraph refers to",
      a: "the growth in the number of judges over time",
      b: "repeated instances of majorities disregarding minority rights",
      c: "the lengthening of constitutional documents",
      d: "the professionalisation of legislatures",
      correct: "b",
      explanation:
        "The sentence immediately after the phrase supplies its content: majorities 'could be careless with the rights of people who were not in the majority', and legislatures did not correct themselves. That accumulated record is the experience meant. The other options introduce developments the passage never discusses.",
    },
    {
      subject: "GK & Current Affairs",
      text: "Which body conducts the Common Law Admission Test?",
      a: "The National Testing Agency",
      b: "The Bar Council of India",
      c: "The Consortium of National Law Universities",
      d: "The University Grants Commission",
      correct: "c",
      explanation:
        "The Consortium of NLUs, headquartered at NLSIU Bengaluru, has conducted CLAT since 2019. The NTA conducts CUET and NEET; the Bar Council regulates legal practice and runs the All India Bar Examination; the UGC is a funding and standards body.",
    },
    {
      subject: "GK & Current Affairs",
      text: "The Fundamental Duties were added to the Constitution on the recommendation of which committee?",
      a: "Swaran Singh Committee",
      b: "Sarkaria Commission",
      c: "Mandal Commission",
      d: "Kothari Commission",
      correct: "a",
      explanation:
        "The Swaran Singh Committee recommended them, and the 42nd Amendment (1976) inserted them as Part IV-A, Article 51A. The Sarkaria Commission examined Centre–State relations, the Mandal Commission backward-class reservation, and the Kothari Commission education policy.",
    },
    {
      subject: "Legal Reasoning",
      passage: TORT_PRINCIPLE,
      text: "Which element of the principle would Anil find hardest to establish if Meera had put up a clearly visible 'Wet Floor' sign that Anil walked straight past?",
      a: "Duty of care",
      b: "Breach of duty",
      c: "Causation",
      d: "Foreseeability of the injury",
      correct: "b",
      explanation:
        "A visible warning is the care the situation called for, so Meera would no longer have fallen short of her duty — the breach element is what gives way. The duty still exists (a), the fall still caused the fracture (c), and a customer slipping is still foreseeable (d). Identifying which single element a change in facts attacks is the core skill this format tests.",
    },
    {
      subject: "Legal Reasoning",
      text: "PRINCIPLE: An offer must be communicated to the offeree. A person who does an act in ignorance of an offer cannot claim the reward attached to it.\n\nFACTS: A newspaper announces a ₹50,000 reward for information leading to a missing dog. Priya, who has not seen the announcement, finds the dog and returns it. She later learns of the reward and claims it.",
      a: "Priya can claim the reward because she performed the required act",
      b: "Priya cannot claim the reward because the offer was never communicated to her",
      c: "Priya can claim the reward because the announcement was public",
      d: "Priya cannot claim the reward because she did not return the dog quickly enough",
      correct: "b",
      explanation:
        "The principle's second sentence decides the case directly: acting in ignorance of an offer means no claim to its reward. Priya had not seen the announcement when she acted. (a) and (c) rely on performance and publication, but the principle makes communication to the offeree the test. (d) adds a time condition nowhere in the principle.",
    },
    {
      subject: "Logical Reasoning",
      text: "'If the monsoon is late, reservoir levels fall. Reservoir levels have fallen.'\n\nWhich conclusion follows?",
      a: "The monsoon was late",
      b: "The monsoon was not late",
      c: "It cannot be concluded that the monsoon was late",
      d: "Reservoir levels will rise next year",
      correct: "c",
      explanation:
        "This is affirming the consequent. A late monsoon is given as one cause of falling levels, not the only one — heavier drawdown or a heatwave would do it too. Observing the effect therefore does not establish that particular cause. (a) is the fallacy itself, (b) overcorrects into the opposite error, and (d) is an unrelated prediction.",
    },
    {
      subject: "Logical Reasoning",
      text: "Six friends sit in a row. Priya is immediately to the left of Quddus. Rahul is at one end. Quddus is not at either end. Which of the following must be true?",
      a: "Priya is at one end",
      b: "Priya is not at the right end",
      c: "Rahul sits beside Quddus",
      d: "Priya sits beside Rahul",
      correct: "b",
      explanation:
        "Priya has Quddus immediately to her right, so there is at least one seat to her right — she cannot be the rightmost. That is forced, so it 'must be true'. (a) is possible but not necessary; Priya could be in the middle. (c) and (d) are likewise merely possible. In must-be-true questions, test each option for whether a counter-arrangement exists.",
    },
    {
      subject: "Quantitative",
      text: "A student answers 80 of 150 questions, gets 60 right, and loses 0.25 for each wrong answer. What is the score?",
      a: "55",
      b: "57.5",
      c: "60",
      d: "50",
      correct: "a",
      explanation:
        "Wrong = 80 − 60 = 20. Penalty = 20 × 0.25 = 5. Score = 60 − 5 = 55. The 70 unattempted questions carry no penalty — only attempts can be wrong.",
    },
    {
      subject: "Quantitative",
      text: "If 40% of a batch is 96 students, what is the full batch size?",
      a: "220",
      b: "240",
      c: "260",
      d: "280",
      correct: "b",
      explanation:
        "40% of x = 96, so x = 96 ÷ 0.4 = 240. A faster route: 40% is 96, so 10% is 24, so 100% is 240 — scaling from 10% is usually quicker than dividing under time pressure.",
    },
  ],
};

export const SEED_PAPERS: SeedPaper[] = [
  LEGAL_REASONING_PRACTICE,
  ENGLISH_PRACTICE,
  LOGICAL_PRACTICE,
  QUANT_PRACTICE,
  GK_PRACTICE,
  MOCK_1,
];

// ── Study notes & current-affairs digests ────────────────────

export const SEED_NOTES: SeedNote[] = [
  {
    title: "Legal Reasoning: how to attack a principle-and-facts question",
    type: "notes",
    body: `The single biggest source of lost marks in Legal Reasoning is answering with what the law actually is instead of what the given principle says. The section tests application, not legal knowledge.

A method that works under time pressure:

1. Read the PRINCIPLE first, and read it twice.
   Underline every condition it states. Most principles are a list of requirements joined by "and" — every one must be satisfied. If a principle names three elements, a fact pattern that satisfies two of them produces no liability.

2. Watch the connecting words.
   "shall" and "must" create obligations. "unless", "except" and "provided that" create exceptions — and an exception that is not in the principle does not exist for your purposes. Self-defence, consent, good faith: if the principle is silent on them, they are irrelevant, however strongly your instinct says otherwise.

3. Read the FACTS and tag them against the elements.
   Go element by element. Which fact satisfies element one? Element two? An element with no supporting fact is the answer to the question.

4. Eliminate options that add conditions.
   Wrong options in this section almost always do one of three things: add a requirement the principle never stated, seize on one satisfied element and stop, or answer using the real law. Learning to spot these three shapes is worth more than memorising cases.

5. Answer with the principle, not with fairness.
   The result will sometimes feel unjust. That is often deliberate — the paper is checking whether you apply a rule you did not write.

One worked line to remember: if the principle makes liability turn on foreseeability, then a fact pattern about an unforeseeable trespasser fails at element one, and nothing after that matters.`,
  },
  {
    title: "Constitution: Fundamental Rights at a glance",
    type: "notes",
    body: `Part III, Articles 12–35. These are the articles that recur in Legal Reasoning passages and in GK, so it is worth knowing the structure rather than just the numbers.

Article 12 — defines "State". Fundamental rights are enforceable against the State, so what counts as State decides whether a right applies at all.
Article 13 — laws inconsistent with fundamental rights are void. This is what gives Part III its teeth.

Right to Equality (14–18)
  14 — equality before the law and equal protection of the laws.
  15 — no discrimination on grounds of religion, race, caste, sex or place of birth.
  16 — equality of opportunity in public employment.
  17 — abolition of untouchability.
  18 — abolition of titles.

Right to Freedom (19–22)
  19 — six freedoms: speech and expression, assembly, association, movement, residence, profession. Each carries its own "reasonable restrictions" clause, and questions usually turn on those.
  20 — protection in respect of conviction: no ex post facto law, no double jeopardy, no self-incrimination.
  21 — life and personal liberty. The most litigated article in the Constitution; privacy, livelihood, a clean environment and a speedy trial have all been read into it.
  21A — free and compulsory education for children aged 6 to 14.
  22 — protection against arbitrary arrest and detention.

Right against Exploitation (23–24)
  23 — prohibits trafficking and forced labour.
  24 — no child under 14 in a factory, mine or other hazardous work.

Right to Freedom of Religion (25–28)
  25 — freedom of conscience and free profession, practice and propagation of religion.
  26 — freedom to manage religious affairs.
  27 — no compulsory taxes for promotion of a religion.
  28 — freedom from religious instruction in State-funded institutions.

Cultural and Educational Rights (29–30)
  29 — protection of the interests of minorities.
  30 — right of minorities to establish and administer educational institutions.

Right to Constitutional Remedies (32)
  Dr Ambedkar called Article 32 "the heart and soul of the Constitution" — a right whose only job is to make the other rights enforceable. Five writs: habeas corpus, mandamus, prohibition, certiorari, quo warranto.

Note: the right to property was removed from Part III by the 44th Amendment (1978) and now sits in Article 300A as a constitutional, not fundamental, right. This is a favourite exam point.`,
  },
  {
    title: "English: finishing all reading-comprehension passages in time",
    type: "notes",
    body: `CLAT English is four to six passages of roughly 450 words each, with four to six questions apiece. The constraint is not reading speed — it is decision speed.

Budget
Give yourself about seven to eight minutes per passage including its questions. If a passage is running long, answer what you can and move; an unattempted passage costs far more than a rushed one.

Read the questions first — but only their stems
Skim what is being asked before reading, and ignore the options. Knowing that a passage will be asked about tone and about the author's main argument changes how you read it. Reading the options first, by contrast, plants four ideas in your head before you have formed your own.

Read for structure, not for detail
Mark where the argument turns. Words like "but", "however", "what changed", "and yet" carry the passage's logic. Authors put their real claim just after a turn, and main-idea questions are almost always answered there.

Question types and their traps
  Main idea — the answer covers the whole passage. An option that is true of only one paragraph is the commonest wrong answer.
  Inference — the answer must follow from the text but not be stated in it. Extreme words ("always", "never", "all") are usually wrong; inference answers are cautious.
  Tone — find the adjectives and verbs the author chose. Two of the four options are usually far too strong.
  Vocabulary in context — the dictionary meaning is a distractor. Substitute each option into the sentence and read it aloud in your head.
  Specific detail — go back and locate the line. Never answer these from memory.

Elimination beats selection
On a hard question, ruling out two options takes less time than proving one, and it turns a 25% guess into 50%. Mark it, move on, and come back only if time allows.`,
  },
  {
    title: "Quantitative Techniques: the formulas that actually appear",
    type: "notes",
    body: `CLAT Quant is ten to fifteen questions, data-led, drawn from a narrow band of elementary mathematics. The syllabus is small — the marks go to whoever is quick and accurate, not to whoever knows the most.

Percentages
  Percentage change = (change ÷ ORIGINAL value) × 100. Dividing by the new value is the single most common error.
  Successive changes of a% then b% combine to a + b + (ab/100). A 20% rise followed by a 20% fall is a 4% net fall, not zero.
  Fraction shortcuts save real seconds: 12.5% = 1/8, 16.66% = 1/6, 20% = 1/5, 25% = 1/4, 33.33% = 1/3, 37.5% = 3/8, 62.5% = 5/8.

Profit and loss
  SP = CP × (1 + profit%). Profit and loss percentages are always on cost price unless the question says otherwise.
  Two articles sold at the same price, one at x% profit and one at x% loss, always produce a net LOSS of (x²/100)%.

Averages
  Always convert to totals before combining. Average of averages is only valid when the group sizes are equal — the exam relies on candidates forgetting this.
  New average after adding one value = (old total + new value) ÷ new count.

Ratios
  Find the value of one part first, then scale. If a:b = 5:3 and a = 160, one part is 32, so b = 96.
  To compare two ratios, cross-multiply rather than converting to decimals.

Negative marking arithmetic
  With +1 correct and −0.25 wrong: score = correct − 0.25 × wrong. Unattempted questions never enter the equation. Given a score and an attempt count, set correct = x and solve — it collapses to 1.25x every time.

Interest
  Simple interest = (P × R × T) ÷ 100.
  Compound interest = P[(1 + R/100)^T − 1]. For two years, CI − SI = P(R/100)², which is fast enough to use in the exam.

Speed, time, distance
  Speed = distance ÷ time. To convert km/h to m/s multiply by 5/18; the other way, multiply by 18/5.`,
  },
  {
    title: "Law of Torts: negligence, the three-element test",
    type: "notes",
    body: `Negligence is the tort that appears most often in CLAT Legal Reasoning passages, because it has a clean structure that a principle can state in two sentences.

The three elements
  1. Duty of care. The defendant owed the claimant a duty to take reasonable care. Whether a duty exists usually turns on foreseeability: would a reasonable person foresee that carelessness here could injure this sort of person? A shopkeeper owes it to customers; a driver to other road users; a doctor to patients.
  2. Breach. The defendant fell below the standard of a reasonable person in that position. The standard is objective — the defendant's own best effort is not the test — and rises with the risk involved.
  3. Causation and damage. The breach in fact caused the injury, and the injury is not too remote a consequence of it. The usual test is "but for": but for the breach, would the harm have happened?

All three, together. A principle that names three elements is asking you to check three. Fact patterns in the exam are built to satisfy two and fail the third, and the question is which one.

Defences worth recognising
  Contributory negligence — the claimant's own carelessness contributed to the harm; reduces damages rather than defeating the claim.
  Volenti non fit injuria — the claimant freely consented to the risk.
  Inevitable accident — the harm could not have been avoided by reasonable care.

The exam caution: do not apply any of these unless the principle in front of you mentions it. In a principle-and-facts question, a defence that is not in the principle does not exist, however well you know the real law.

Related torts that appear in passages
  Trespass to land — direct, intentional entry onto another's land; actionable without proof of damage.
  Nuisance — unreasonable interference with the use or enjoyment of land.
  Defamation — a false statement lowering reputation; libel is written, slander spoken.
  Vicarious liability — an employer answers for torts an employee commits in the course of employment.`,
  },
];

export const SEED_CURRENT_AFFAIRS: SeedNote[] = [
  {
    title: "Current Affairs: how to prepare the GK section",
    type: "current-affairs",
    body: `Current Affairs & GK is 35 to 39 questions — roughly a quarter of the paper — and it is the section where a steady habit beats last-minute effort most decisively.

What CLAT actually asks
Since 2020 the section is passage-based. You get a news-style passage of about 450 words and answer questions on it. Some questions can be answered from the passage alone; others need static knowledge around the topic. So the target is not memorising headlines but understanding the areas news comes from.

A daily routine that works in 30 minutes
  10 minutes — one editorial or explainer from a national daily. Read for the argument, not just the event.
  10 minutes — a monthly compilation for the same period, to catch what you missed.
  10 minutes — revise the previous week's notes. Revision is where retention actually happens.

The areas that repeat
  Courts and judgments — Supreme Court and High Court decisions, particularly on fundamental rights.
  Parliament — bills passed, major amendments, important committee reports.
  Polity and governance — constitutional bodies, appointments, centre–state questions.
  International affairs — treaties, summits, India's bilateral relations, UN bodies.
  Economy — RBI decisions, budget headlines, key indices and where India sits in them.
  Awards, sport and appointments — low-yield individually, but cheap to revise.

Making notes you will actually reuse
Keep one line per item: what happened, who was involved, why it matters. Three lines of context beat a page of detail you will never reread. Twenty flashcards a week, revised every Sunday, is a realistic and sufficient target.

What to skip
Exhaustive lists of dates, minor appointments and trivia are a poor use of the time. The section rewards understanding an area well enough to reason about an unfamiliar passage in it.`,
  },
  {
    title: "Landmark judgments every CLAT aspirant should know",
    type: "current-affairs",
    body: `These cases recur across both Legal Reasoning and GK. Know the holding and why it mattered — not the citation.

Kesavananda Bharati v. State of Kerala (1973)
Parliament may amend any part of the Constitution but cannot damage or destroy its basic structure. Decided 7–6 by a thirteen-judge bench, the largest ever constituted. It is the case that fixed the limit on the amending power.

Maneka Gandhi v. Union of India (1978)
"Procedure established by law" in Article 21 must be fair, just and reasonable — not any procedure a legislature happens to enact. It linked Articles 14, 19 and 21 into a single scheme and began the modern expansion of Article 21.

Minerva Mills v. Union of India (1980)
Struck down parts of the 42nd Amendment, holding that limited amending power and the balance between Fundamental Rights and Directive Principles are themselves part of the basic structure.

Vishaka v. State of Rajasthan (1997)
In the absence of legislation on sexual harassment at the workplace, the Court laid down binding guidelines drawn from international conventions. These were later given statutory form by the 2013 Act.

K.S. Puttaswamy v. Union of India (2017)
A nine-judge bench unanimously held the right to privacy to be a fundamental right under Article 21, overruling earlier decisions to the contrary.

Navtej Singh Johar v. Union of India (2018)
Read down Section 377 IPC to decriminalise consensual same-sex relations between adults, holding the provision violative of Articles 14, 15, 19 and 21.

Shayara Bano v. Union of India (2017)
Declared the practice of instant triple talaq unconstitutional.

Indra Sawhney v. Union of India (1992)
Upheld OBC reservation while capping total reservation at 50% and introducing the creamy-layer exclusion.

A tip on using these in Legal Reasoning: a passage may be built around one of these cases, but if it gives you a principle, apply the principle — not the judgment you remember.`,
  },
  {
    title: "The CLAT exam pattern: what you are actually sitting",
    type: "current-affairs",
    body: `Knowing the shape of the paper is worth a few marks on its own, because it decides how you allocate time.

The paper
  Duration — 2 hours.
  Questions — 120 multiple-choice questions (reduced from 150 in earlier years; check the current year's notification).
  Marks — 1 for each correct answer, −0.25 for each wrong answer. Unattempted questions carry no penalty.
  Mode — offline, pen and paper, OMR.

Section weights (approximate)
  English Language — 20%, about 22–26 questions.
  Current Affairs including General Knowledge — 25%, about 28–32 questions.
  Legal Reasoning — 25%, about 28–32 questions.
  Logical Reasoning — 20%, about 22–26 questions.
  Quantitative Techniques — 10%, about 10–14 questions.

Everything is passage-based
Each section presents passages followed by question sets. There is no standalone-question section any more. This is why comprehension speed matters even in Quant and GK.

What the pattern implies for strategy
  Legal Reasoning and Current Affairs together are half the paper. Strength in these two moves your rank more than anything else.
  Quantitative is the smallest section. Target accuracy on the questions you can do quickly rather than completeness.
  With −0.25 negative marking, a genuine 50-50 guess is roughly break-even; a wild guess is not. Eliminate two options before guessing.
  Time per question is about one minute including reading. A passage you cannot follow is better abandoned than fought.

After the exam
CLAT scores feed counselling for 23 participating NLUs. NLU Delhi admits through its own test, AILET, so aspirants targeting it sit both.`,
  },
];
