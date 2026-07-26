// Shapes for the teacher/admin-managed editorial content shown to students.

export type Tip = { title: string; body: string; tag: string; icon: string; color: string; points: string[] };
export type Story = { name: string; quote: string; college: string; rank: string; initials: string; color: string };
export type Update = { title: string; desc: string; tag: string; icon: string; color: string; dateLabel: string; more: string; hot: boolean };
export type VocabItem = { word: string; meaning: string; example: string };
export type CAItem = { q: string; options: string[]; correct: number; explain: string };
export type NLUItem = { name: string; city: string; closing: { general: number; obc: number; ews: number; sc: number; st: number } };

export type StudentResources = {
  tips: Tip[];
  stories: Story[];
  updates: Update[];
  vocab: VocabItem[];
  caq: CAItem[];
  nlus: NLUItem[];
};
