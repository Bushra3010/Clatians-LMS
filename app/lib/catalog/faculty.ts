// ─────────────────────────────────────────────────────────────
// Mirrored from the CLATians website repo (Alok16012/clatinsweb):
//   src/data/faculty.ts
// This is the offline fallback for the catalog. When WEBSITE_URL is
// set, syncCatalog() overwrites these rows from the live site API.
// Keep the shapes identical to the website so the sync stays lossless.
// ─────────────────────────────────────────────────────────────

export interface FacultyMember {
  slug: string;
  name: string;
  designation: string;
  subject: string;
  specialization: string;
  rating: number;
  students: string;
  experience: string;
  avatar: string;
  photo?: string;
  color: string;
  bg: string;
  tags: string[];
  bio: string;
  education: string[];
  achievements: string[];
  courses: string[];
  expertise: { area: string; level: number }[];
}

export const facultyMembers: FacultyMember[] = [
  {
    slug: 'ak-singh',
    name: 'A.K. Singh',
    designation: 'Director, CLATians',
    subject: 'Legal Reasoning & Legal Awareness',
    specialization: 'CLAT, AILET & All Law Entrances',
    rating: 4.9,
    students: '15,000+',
    experience: '15+ Years',
    avatar: 'AK',
    color: '#0050e0',
    bg: '#e8eeff',
    tags: ['Legal Reasoning', 'CLAT Expert', 'Constitutional Law', 'Current Affairs', 'Director'],
    bio: 'A.K. Singh is the Founder & Director of CLATians — India\'s leading law entrance coaching institute based in Patna, Bihar. With over 15 years of dedicated experience in guiding students for CLAT, AILET, and other law entrance examinations, he has personally mentored thousands of students who have secured admissions in top NLUs across India. Known for his unique teaching methodology that combines legal insight with strategic exam preparation, A.K. Singh is also the author of "BHARAT that is INDIA" — a celebrated resource for legal awareness and current affairs. His institute, CLATians (IEE CLATians), has produced over 15,000 successful law students and is recognized as Patna\'s most trusted CLAT coaching institute.',
    education: [
      'Law Graduate — Prestigious Law University',
      '15+ Years of Teaching Experience in Legal Education',
      'Founder & Director — IEE CLATians, Patna',
      'Author — "BHARAT that is INDIA"',
      'Contact: +91-8507700177 | director@clatians.in',
    ],
    achievements: [
      '15,000+ students guided to top law universities',
      'CLATians named Best CLAT Coaching Institute in Bihar',
      'Author of acclaimed book "BHARAT that is INDIA"',
      '25 years of institute\'s excellence in legal education',
      'Produced 1000+ NLU selections since 2015',
      'Launched AI-enhanced learning platform in 2024',
      'Pioneer of Hinglish medium CLAT coaching in Patna',
      'Recipient of multiple education excellence awards',
    ],
    courses: ['Offline CLAT Course', 'Online CLAT Course', 'OLET Program', 'Mock Test Series'],
    expertise: [
      { area: 'Legal Reasoning', level: 99 },
      { area: 'Current Affairs & GK', level: 98 },
      { area: 'Constitutional Law', level: 97 },
      { area: 'CLAT Strategy', level: 99 },
      { area: 'English Language', level: 92 },
    ],
  },
  {
    slug: 'priya-singh',
    name: 'Adv. Priya Singh',
    designation: 'Senior Faculty — English',
    subject: 'English Language & Comprehension',
    specialization: 'English for CLAT & AILET',
    rating: 4.8,
    students: '5,000+',
    experience: '10 Years',
    avatar: 'PS',
    color: '#0050e0',
    bg: '#e8eeff',
    tags: ['English Language', 'Comprehension', 'Vocabulary', 'Grammar'],
    bio: 'Adv. Priya Singh is CLATians\' senior English Language faculty with over 10 years of experience teaching English for CLAT and other law entrance exams. She specializes in making complex comprehension passages approachable and building strong vocabulary foundations. Her students consistently score above 90% in the English section of CLAT.',
    education: [
      'LLB — Patna University',
      'MA English — Patna University',
      'Enrolled Advocate — Bar Council of Bihar',
    ],
    achievements: [
      '5,000+ students trained for CLAT English',
      'Designed CLATians English Module (8 volumes)',
      '95% of students improve English scores within 3 months',
      'Best Faculty Award — CLATians 2022',
    ],
    courses: ['Offline CLAT Course', 'Online CLAT Course'],
    expertise: [
      { area: 'Reading Comprehension', level: 97 },
      { area: 'Grammar & Vocabulary', level: 95 },
      { area: 'Speed Reading', level: 93 },
      { area: 'Error Detection', level: 94 },
    ],
  },
  {
    slug: 'amit-sharma',
    name: 'Adv. Amit Sharma',
    designation: 'Faculty — Reasoning & Quant',
    subject: 'Logical Reasoning & Quantitative Techniques',
    specialization: 'Reasoning & Maths for CLAT',
    rating: 4.8,
    students: '4,500+',
    experience: '8 Years',
    avatar: 'AS',
    color: '#0050e0',
    bg: '#e8eeff',
    tags: ['Logical Reasoning', 'Quantitative Techniques', 'Data Interpretation', 'CLAT'],
    bio: 'Adv. Amit Sharma teaches Logical Reasoning and Quantitative Techniques at CLATians. Known for his shortcut techniques and student-friendly approach, he makes the most challenging reasoning puzzles seem straightforward. His innovative methods help students maximize their scores in the reasoning section.',
    education: [
      'LLB — Bihar National College of Law',
      'B.Tech — NIT Patna (strong analytical background)',
      'Enrolled Advocate — Bar Council of Bihar',
    ],
    achievements: [
      '4,500+ students trained in reasoning and quant',
      'Authored CLATians Reasoning Workbook',
      'Average student improvement: 40% in reasoning scores',
      'Best Innovation in Teaching Award — CLATians 2023',
    ],
    courses: ['Offline CLAT Course', 'Online CLAT Course', 'Mock Test Series'],
    expertise: [
      { area: 'Logical Reasoning', level: 96 },
      { area: 'Analytical Reasoning', level: 95 },
      { area: 'Quantitative Techniques', level: 93 },
      { area: 'Data Interpretation', level: 94 },
    ],
  },
  {
    slug: 'rahul-verma',
    name: 'Adv. Rahul Verma',
    designation: 'Faculty — Current Affairs',
    subject: 'Current Affairs & General Knowledge',
    specialization: 'GK & Legal Current Affairs for CLAT',
    rating: 4.7,
    students: '6,000+',
    experience: '9 Years',
    avatar: 'RV',
    color: '#0050e0',
    bg: '#e8eeff',
    tags: ['Current Affairs', 'General Knowledge', 'Legal News', 'CLAT GK'],
    bio: 'Adv. Rahul Verma is CLATians\' Current Affairs and GK specialist with 9 years of experience. He curates the daily news digest, monthly GK magazine, and conducts weekly live current affairs sessions. His ability to connect current events to legal concepts makes his classes uniquely valuable for CLAT aspirants.',
    education: [
      'LLB — Magadh University',
      'MA Political Science — Patna University',
      'Enrolled Advocate — Bar Council of Bihar',
    ],
    achievements: [
      'Editor — CLATians Monthly GK Magazine',
      '6,000+ students trained in current affairs',
      'Created CLATians Daily News Digest series',
      'Author of "Legal Current Affairs for CLAT 2026"',
    ],
    courses: ['Offline CLAT Course', 'Online CLAT Course', 'OLET Program'],
    expertise: [
      { area: 'Current Affairs', level: 98 },
      { area: 'Legal GK', level: 96 },
      { area: 'Static GK', level: 92 },
      { area: 'International Affairs', level: 90 },
    ],
  },
];

export function getFacultyBySlug(slug: string): FacultyMember | undefined {
  return facultyMembers.find((f) => f.slug === slug);
}
