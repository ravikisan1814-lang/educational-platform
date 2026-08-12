// Content structure definitions for the platform.

export interface Subject {
  name: string;
  slug: string;
  description: string;
}

export interface ClassSection {
  id: string;
  title: string;
  description: string;
}

export interface ContentBlockType {
  id: string;
  label: string;
  description: string;
}

export const SUBJECTS: Subject[] = [
  { name: "Biology", slug: "biology", description: "Life sciences, cell biology, genetics, and ecology." },
  { name: "Chemistry", slug: "chemistry", description: "Physical, organic, and inorganic chemistry." },
  { name: "English", slug: "english", description: "Grammar, literature, and composition." },
  { name: "Mathematics", slug: "mathematics", description: "Algebra, calculus, geometry, and statistics." },
  { name: "Nepali", slug: "nepali", description: "Nepali language, literature, and grammar." },
  { name: "Physics", slug: "physics", description: "Mechanics, waves, electricity, and modern physics." },
  { name: "Computer Science", slug: "computer-science", description: "Programming, databases, and computer fundamentals." },
];

export const CLASS_11_SECTIONS: ClassSection[] = [
  { id: "class-11", title: "Class 11", description: "Core Class 11 curriculum." },
  { id: "class-11-more", title: "Class 11 More", description: "Extended Class 11 topics and practice." },
  { id: "class-11-extra", title: "Class 11 Extra", description: "Additional Class 11 resources and past papers." },
];

export const CLASS_12_SECTIONS: ClassSection[] = [
  { id: "class-12", title: "Class 12", description: "Core Class 12 curriculum." },
  { id: "class-12-more", title: "Class 12 More", description: "Extended Class 12 topics and practice." },
  { id: "class-12-extra", title: "Class 12 Extra", description: "Additional Class 12 resources and past papers." },
];

export const CONTENT_BLOCKS: ContentBlockType[] = [
  { id: "note", label: "Note", description: "Detailed topic notes." },
  { id: "topic", label: "Topic", description: "Topic overview and outline." },
  { id: "mind-map", label: "Mind-map", description: "Visual mind-map of the topic." },
  { id: "conceptual-points", label: "Conceptual Points", description: "Key concepts explained." },
  { id: "examples", label: "Examples", description: "Worked examples." },
  { id: "bullet-points", label: "Bullet Points", description: "Quick revision bullet points." },
  { id: "past-year-questions", label: "Past Year Questions", description: "Previous exam questions with answers." },
  { id: "mcqs", label: "MCQs", description: "Multiple choice questions." },
  { id: "short-questions", label: "Short Questions", description: "Short answer questions." },
  { id: "long-questions", label: "Long Questions", description: "Long answer questions." },
  { id: "numericals", label: "Numericals", description: "Numerical problems with solutions." },
  { id: "formulas", label: "Formulas", description: "Important formulas." },
];
