// Shapes for the teacher/admin-managed editorial content shown to students.

export type Tip = { title: string; body: string; tag: string; icon: string; color: string; points: string[] };
export type Story = { name: string; quote: string; college: string; rank: string; initials: string; color: string };
export type Update = { title: string; desc: string; tag: string; icon: string; color: string; dateLabel: string; more: string; hot: boolean };
/** Home carousel slide: an image, and where a tap takes the student ("tests", "courses", a URL, or nowhere). */
export type Banner = { title: string; image: string; link: string };

export type StudentResources = {
  tips: Tip[];
  stories: Story[];
  updates: Update[];
  banners: Banner[];
};
