import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import type { AccessLevel, ExamGroupNode } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ContentRow {
  id: string;
  topic_id: string;
  title: string;
  access_level: number;
  owner_contact: string | null;
  public_teaser: string;
}

interface TopicRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  content_items: ContentRow[];
}

interface SubChapterRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  topics: TopicRow[];
}

interface ChapterRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  sub_chapters: SubChapterRow[];
}

interface SubjectRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  chapters: ChapterRow[];
}

interface ExamGroupRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  subjects: SubjectRow[];
}

const DEMO_HIERARCHY: ExamGroupNode[] = [
  {
    id: "eg-loksewa",
    slug: "loksewa",
    name: "Loksewa",
    description: "Loksewa / Public Service Commission exam preparation.",
    sort_order: 1,
    subjects: [
      {
        id: "s-governance",
        slug: "governance-public-admin",
        name: "Governance & Public Admin",
        description: "Constitution, administrative law, and public administration.",
        sort_order: 1,
        chapters: [
          {
            id: "c-constitution",
            slug: "constitutional-law",
            name: "Constitutional Law",
            description: "Nepal constitution, fundamental rights and duties.",
            sort_order: 1,
            sub_chapters: [
              {
                id: "sc-fundamental-rights",
                slug: "fundamental-rights",
                name: "Fundamental Rights",
                description: "Rights and freedoms guaranteed by the constitution.",
                sort_order: 1,
                topics: [
                  {
                    id: "t-right-to-equality",
                    slug: "right-to-equality",
                    name: "Right to Equality",
                    description: "Article 18 of the Constitution of Nepal.",
                    sort_order: 1,
                    content_items: [
                      {
                        id: "ci-right-to-equality",
                        title: "Right to Equality — Constitution Notes",
                        topic_id: "t-right-to-equality",
                        access_level: 3,
                        owner_contact: "ravikisan1814@gmail.com",
                        public_teaser:
                          "<p>The Constitution of Nepal guarantees equality before the law and equal protection of the laws for all citizens.</p>",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "eg-gk",
    slug: "general-knowledge",
    name: "General Knowledge",
    description: "General knowledge and current awareness material.",
    sort_order: 2,
    subjects: [
      {
        id: "s-geography",
        slug: "geography",
        name: "Geography",
        description: "World and Nepal geography for general knowledge.",
        sort_order: 1,
        chapters: [],
      },
    ],
  },
  {
    id: "eg-academic-core",
    slug: "academic-core",
    name: "Academic Core",
    description: "NEB Class 11 & 12 core subjects.",
    sort_order: 3,
    subjects: [
      {
        id: "s-physics",
        slug: "physics",
        name: "Physics",
        description: "Mechanics, optics, heat, electricity and modern physics.",
        sort_order: 1,
        chapters: [
          {
            id: "c-mechanics",
            slug: "mechanics",
            name: "Mechanics",
            description: "Vectors, kinematics, dynamics and Newton laws.",
            sort_order: 1,
            sub_chapters: [
              {
                id: "sc-vectors",
                slug: "vectors",
                name: "Vectors",
                description: "Vector operations and applications.",
                sort_order: 1,
                topics: [
                  {
                    id: "t-vector-addition",
                    slug: "vector-addition",
                    name: "Vector Addition",
                    description: "Adding vectors graphically and by components.",
                    sort_order: 1,
                    content_items: [
                      {
                        id: "ci-vector-addition",
                        title: "Vector Addition — Full Notes",
                        topic_id: "t-vector-addition",
                        access_level: 2,
                        owner_contact: "ravikisan1814@gmail.com",
                        public_teaser:
                          "<p>Vectors are quantities that have both <strong>magnitude</strong> and <strong>direction</strong>.</p>",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * GET /api/hierarchy
 *
 * PUBLIC. Returns the full syllabus map (exam_groups -> subjects -> chapters
 * -> sub_chapters -> topics -> content_items). Cards/covers are never locked —
 * navigation is always open. Only including the public metadata + public_teaser
 * for content items; locked_payload/variants are served by /api/content/[id].
 */
export async function GET() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    // Supabase env vars not configured — serve demo hierarchy so the
    // /learn explorer still renders (same pattern as /api/contents).
    return NextResponse.json({
      data: DEMO_HIERARCHY,
      user_access_level: 4,
      demo: true,
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  let accessLevel: AccessLevel = 4;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("access_level")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.access_level) {
      accessLevel = profile.access_level as AccessLevel;
    }
  }

  const { data, error } = await supabase
    .from("exam_groups")
    .select(
      `id, slug, name, description, sort_order,
       subjects(
         id, slug, name, description, sort_order,
         chapters(
           id, slug, name, description, sort_order,
           sub_chapters(
             id, slug, name, description, sort_order,
             topics(
               id, slug, name, description, sort_order,
               content_items(id, title, access_level, owner_contact, public_teaser)
             )
           )
         )
       )`
    )
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Normalize rows: filter out content items that have no teaser? No — all
  // content_items rows carry a teaser. We DO NOT strip locked content here:
  // the DB column grants mean locked_payload/variants are not even selectable.
  const tree = ((data as unknown as ExamGroupRow[] | null) ?? []).map(
    (group): ExamGroupNode => ({
      id: group.id,
      slug: group.slug,
      name: group.name,
      description: group.description,
      sort_order: group.sort_order,
      subjects: (group.subjects ?? []).map((subject) => ({
        id: subject.id,
        slug: subject.slug,
        name: subject.name,
        description: subject.description,
        sort_order: subject.sort_order,
        chapters: (subject.chapters ?? []).map((chapter) => ({
          id: chapter.id,
          slug: chapter.slug,
          name: chapter.name,
          description: chapter.description,
          sort_order: chapter.sort_order,
          sub_chapters: (chapter.sub_chapters ?? []).map((sub) => ({
            id: sub.id,
            slug: sub.slug,
            name: sub.name,
            description: sub.description,
            sort_order: sub.sort_order,
            topics: (sub.topics ?? []).map((topic) => ({
              id: topic.id,
              slug: topic.slug,
              name: topic.name,
              description: topic.description,
              sort_order: topic.sort_order,
              content_items: (topic.content_items ?? []).map((ci) => ({
                id: ci.id,
                title: ci.title,
                topic_id: ci.topic_id,
                access_level: ci.access_level as AccessLevel,
                owner_contact: ci.owner_contact,
                public_teaser: ci.public_teaser,
              })),
            })),
          })),
        })),
      })),
    })
  );

  return NextResponse.json({
    data: tree,
    user_access_level: accessLevel,
  });
}