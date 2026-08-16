/** Six core NEB subjects shown under each Class 11 / Class 12 track. */
export const CORE_SUBJECTS = [
  { name: "Biology", slug: "biology" },
  { name: "Chemistry", slug: "chemistry" },
  { name: "English", slug: "english" },
  { name: "Mathematics", slug: "mathematics" },
  { name: "Nepali", slug: "nepali" },
  { name: "Physics", slug: "physics" },
] as const;

export interface DashboardTrack {
  label: string;
  examGroupSlug: string;
  /** When true, links go to /learn/{slug} only (no subject grid). */
  directLink?: boolean;
}

export interface DashboardPillar {
  id: string;
  title: string;
  tracks: DashboardTrack[];
}

export const DASHBOARD_PILLARS: DashboardPillar[] = [
  {
    id: "class-11",
    title: "Class 11",
    tracks: [
      { label: "Class 11 Notes", examGroupSlug: "class-11" },
      { label: "Class 11E", examGroupSlug: "class-11e" },
      { label: "Class 11 More", examGroupSlug: "class-11-more" },
    ],
  },
  {
    id: "class-12",
    title: "Class 12",
    tracks: [
      { label: "Class 12 Notes", examGroupSlug: "class-12" },
      { label: "Class 12E", examGroupSlug: "class-12e" },
      { label: "Class 12 More", examGroupSlug: "class-12-more" },
    ],
  },
  {
    id: "knowledge",
    title: "Knowledge",
    tracks: [
      {
        label: "Loksewa Knowledge",
        examGroupSlug: "loksewa",
        directLink: true,
      },
      {
        label: "World Knowledge",
        examGroupSlug: "general-knowledge",
        directLink: true,
      },
    ],
  },
];

export const DASHBOARD_VIEWS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "syllabus", label: "Syllabus", icon: "📚" },
  { id: "favorites", label: "Favorites", icon: "⭐" },
  { id: "recent", label: "Recent", icon: "🕐" },
  { id: "official", label: "Official", icon: "🎓" },
] as const;

export type DashboardViewId = (typeof DASHBOARD_VIEWS)[number]["id"];

export function subjectLearnHref(examGroupSlug: string, subjectSlug: string): string {
  return `/learn/${examGroupSlug}/${subjectSlug}`;
}

export function trackLearnHref(track: DashboardTrack): string {
  return `/learn/${track.examGroupSlug}`;
}
