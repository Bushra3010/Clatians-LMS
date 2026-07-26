// Static reference data for the CLAT student tools. Indicative figures for a
// demo — swap for a maintained dataset (or a DB table) in production.

export type Category = "general" | "obc" | "ews" | "sc" | "st";

export type NLU = {
  name: string;
  city: string;
  // Indicative CLAT closing ranks by category.
  closing: Record<Category, number>;
};

export const NLUS: NLU[] = [
  { name: "NLSIU Bangalore", city: "Bengaluru", closing: { general: 130, obc: 300, ews: 220, sc: 900, st: 1400 } },
  { name: "NALSAR Hyderabad", city: "Hyderabad", closing: { general: 210, obc: 480, ews: 360, sc: 1300, st: 2100 } },
  { name: "WBNUJS Kolkata", city: "Kolkata", closing: { general: 330, obc: 720, ews: 540, sc: 1900, st: 3000 } },
  { name: "NLU Jodhpur", city: "Jodhpur", closing: { general: 560, obc: 1100, ews: 820, sc: 2600, st: 4200 } },
  { name: "GNLU Gandhinagar", city: "Gandhinagar", closing: { general: 720, obc: 1450, ews: 1050, sc: 3200, st: 5000 } },
  { name: "HNLU Raipur", city: "Raipur", closing: { general: 1100, obc: 2100, ews: 1600, sc: 4200, st: 6500 } },
  { name: "RMLNLU Lucknow", city: "Lucknow", closing: { general: 1300, obc: 2500, ews: 1900, sc: 4800, st: 7200 } },
  { name: "RGNUL Patiala", city: "Patiala", closing: { general: 1600, obc: 3000, ews: 2300, sc: 5500, st: 8200 } },
  { name: "CNLU Patna", city: "Patna", closing: { general: 2100, obc: 3800, ews: 2900, sc: 6500, st: 9500 } },
  { name: "NUSRL Ranchi", city: "Ranchi", closing: { general: 2600, obc: 4500, ews: 3500, sc: 7500, st: 11000 } },
  { name: "NLUJA Assam", city: "Guwahati", closing: { general: 3200, obc: 5400, ews: 4300, sc: 8800, st: 12500 } },
  { name: "DSNLU Visakhapatnam", city: "Visakhapatnam", closing: { general: 3800, obc: 6200, ews: 5000, sc: 9800, st: 14000 } },
];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "general", label: "General" },
  { value: "obc", label: "OBC-NCL" },
  { value: "ews", label: "EWS" },
  { value: "sc", label: "SC" },
  { value: "st", label: "ST" },
];

export type CAQuestion = { q: string; options: string[]; correct: number; explain: string };

export const CA_QUIZ: CAQuestion[] = [
  { q: "Which body conducts the CLAT exam?", options: ["UGC", "Consortium of NLUs", "NTA", "AIBE"], correct: 1, explain: "CLAT is conducted by the Consortium of National Law Universities." },
  { q: "The 'Right to Privacy' was declared a fundamental right in which case?", options: ["Kesavananda Bharati", "Maneka Gandhi", "K.S. Puttaswamy", "Minerva Mills"], correct: 2, explain: "Justice K.S. Puttaswamy v. Union of India (2017) recognised privacy as a fundamental right under Article 21." },
  { q: "Who is the current Chief Justice-appointing authority under the Constitution?", options: ["The President", "The Prime Minister", "The Law Minister", "The Parliament"], correct: 0, explain: "The President appoints the CJI and other judges of the Supreme Court." },
  { q: "Which article deals with the Right to Constitutional Remedies?", options: ["Article 19", "Article 21", "Article 32", "Article 44"], correct: 2, explain: "Article 32 — called the 'heart and soul' of the Constitution by Dr. Ambedkar." },
  { q: "The National Green Tribunal was established under an Act of which year?", options: ["2005", "2010", "2013", "2016"], correct: 1, explain: "The NGT was established under the National Green Tribunal Act, 2010." },
  { q: "'Ubi jus ibi remedium' means:", options: ["Let the buyer beware", "Where there is a right, there is a remedy", "A thing decided", "Beyond the powers"], correct: 1, explain: "It is a legal maxim: where there is a right, there is a remedy." },
];

export type Vocab = { word: string; meaning: string; example: string };

export const VOCAB: Vocab[] = [
  { word: "Ephemeral", meaning: "Lasting for a very short time", example: "Fame in the digital age can be ephemeral." },
  { word: "Ubiquitous", meaning: "Present everywhere", example: "Smartphones have become ubiquitous." },
  { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically", example: "She took a pragmatic approach to the problem." },
  { word: "Candid", meaning: "Truthful and straightforward", example: "He gave a candid account of the events." },
  { word: "Meticulous", meaning: "Showing great attention to detail", example: "The lawyer was meticulous in preparing the brief." },
  { word: "Cogent", meaning: "Clear, logical and convincing", example: "The counsel made a cogent argument before the bench." },
  { word: "Prudent", meaning: "Acting with care and thought for the future", example: "It is prudent to read every clause of a contract." },
  { word: "Ambiguous", meaning: "Open to more than one interpretation", example: "The statute's wording was ambiguous." },
  { word: "Redundant", meaning: "No longer needed or useful; superfluous", example: "The clause was redundant and later deleted." },
  { word: "Tenacious", meaning: "Holding firmly; persistent", example: "Her tenacious cross-examination broke the witness." },
];
