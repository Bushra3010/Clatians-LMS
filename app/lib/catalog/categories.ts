// ─────────────────────────────────────────────────────────────
// Mirrored from the CLATians website repo (Alok16012/clatinsweb):
//   src/data/courseCategories.ts
// This is the offline fallback for the catalog. When WEBSITE_URL is
// set, syncCatalog() overwrites these rows from the live site API.
// Keep the shapes identical to the website so the sync stays lossless.
// ─────────────────────────────────────────────────────────────

export interface CourseCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  accent: string;
  bg: string;
}

export const defaultCourseCategories: CourseCategory[] = [
  { key: 'offline', label: 'Offline Course', icon: '🏫', color: '#0f3460', accent: '#08BD80', bg: '#E6FAF4' },
  { key: 'online', label: 'Online Course', icon: '💻', color: '#6d28d9', accent: '#8b5cf6', bg: '#ede9fe' },
  { key: 'mentorship', label: 'Mentorship', icon: '🎯', color: '#065f46', accent: '#34d399', bg: '#d1fae5' },
  { key: 'mock', label: 'Mock Tests', icon: '📝', color: '#92400e', accent: '#f59e0b', bg: '#fef3c7' },
];
