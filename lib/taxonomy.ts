/**
 * Educational Content Taxonomy System - 8-Tier Classification
 * 
 * This module defines the hierarchical classification system for all educational content.
 * Follows the strict 8-tier educational taxonomy:
 * Tier 1: Class (Academic year/grade level)
 * Tier 2: Subject (Core field of study)
 * Tier 3: Chapter (Main curricular modules)
 * Tier 4: Sub-Chapter (Specific section/sub-topic breakdown)
 * Tier 5: Core Concepts (Fundamental principles or atomic theory nodes)
 * Tier 6: Learning Assets (Notes, Mind Maps, Summaries)
 * Tier 7: Practical Applications (Equations, Formulas, Numericals)
 * Tier 8: Assessment Repository (PYQs, Mock Items, Practice Problems)
 */

export type EducationTier = 
  | "Class"      // Tier 1
  | "Subject"    // Tier 2
  | "Chapter"    // Tier 3
  | "SubChapter" // Tier 4
  | "CoreConcept" // Tier 5
  | "LearningAsset" // Tier 6
  | "PracticalApp"  // Tier 7
  | "Assessment"; // Tier 8

export interface EducationNode {
  id: string;
  slug: string;
  name: string;
  tier: EducationTier;
  description?: string;
  parent_id: string | null;
  sort_order: number;
  children?: EducationNode[];
  /** Content specific to this node based on its tier */
  content?: {
    /** For Tier 6: Notes, Mind Maps, Summaries */
    notes?: string;
    mind_map?: string;
    summary?: string;
    /** For Tier 7: Equations, Formulas, Step-by-Step Numericals */
    equations?: string[];
    formulas?: string[];
    numerals?: Array<{
      problem: string;
      solution: string;
      steps?: string[];
    }>;
    /** For Tier 8: PYQs, Mock Items, Practice Problems */
    pyqs?: Array<{
      year: number;
      question: string;
      marks: number;
      answer?: string;
    }>;
    mock_items?: Array<{
      question: string;
      options?: string[];
      answer: number;
      explanation?: string;
    }>;
    practice_problems?: Array<{
      question: string;
      difficulty: "easy" | "medium" | "hard";
      solution?: string;
    }>;
  };
}

/**
 * Root taxonomy structure for the educational platform
 */
export const EDUCATION_TAXONOMY: EducationNode[] = [
  {
    id: "class-11",
    slug: "class-11",
    name: "Class 11",
    tier: "Class",
    description: "First year of +2 education under NEB curriculum",
    parent_id: null,
    sort_order: 1,
    children: [
      {
        id: "physics-11",
        slug: "physics",
        name: "Physics",
        tier: "Subject",
        description: "Study of matter, energy, and their interactions",
        parent_id: "class-11",
        sort_order: 1,
        children: [
          {
            id: "kinematics-11",
            slug: "kinematics",
            name: "Kinematics",
            tier: "Chapter",
            description: "Description of motion without considering forces",
            parent_id: "physics-11",
            sort_order: 1,
            children: [
              {
                id: "projectile-motion-11",
                slug: "projectile-motion",
                name: "Projectile Motion",
                tier: "SubChapter",
                description: "Motion of objects projected into the air",
                parent_id: "kinematics-11",
                sort_order: 1,
                children: [
                  {
                    id: "velocity-components-11",
                    slug: "velocity-components",
                    name: "Velocity Components",
                    tier: "CoreConcept",
                    description: "Horizontal and vertical velocity components",
                    parent_id: "projectile-motion-11",
                    sort_order: 1,
                    children: [
                      {
                        id: "notes-velocity",
                        slug: "notes-velocity-components",
                        name: "Velocity Components Notes",
                        tier: "LearningAsset",
                        description: "Complete notes on velocity components in projectile motion",
                        parent_id: "velocity-components-11",
                        sort_order: 1,
                        content: {
                          notes: "In projectile motion, velocity has two components: horizontal (constant) and vertical (changing due to gravity). The horizontal component remains unchanged throughout the motion, while the vertical component changes at a rate of g = 9.8 m/s² downward.",
                          summary: "Key points: vx = v₀cosθ (constant), vy = v₀sinθ - gt (varies with time)"
                        }
                      },
                      {
                        id: "formula-velocity",
                        slug: "formula-velocity-components",
                        name: "Velocity Formulas",
                        tier: "PracticalApp",
                        description: "Formulas for velocity components",
                        parent_id: "velocity-components-11",
                        sort_order: 2,
                        content: {
                          formulas: [
                            "v_x = v₀ · cos(θ)",
                            "v_y = v₀ · sin(θ) - g·t",
                            "v = √(v_x² + v_y²)"
                          ]
                        }
                      },
                      {
                        id: "pyq-velocity",
                        slug: "pyq-velocity-components",
                        name: "Velocity Components PYQs",
                        tier: "Assessment",
                        description: "Previous year questions on velocity components",
                        parent_id: "velocity-components-11",
                        sort_order: 3,
                        content: {
                          pyqs: [
                            {
                              year: 2023,
                              question: "A ball is projected with velocity 20 m/s at angle 30°. Find horizontal and vertical components of velocity after 1 second.",
                              marks: 5,
                              answer: "v_x = 20cos30° = 17.32 m/s (constant), v_y = 20sin30° - 9.8×1 = 10 - 9.8 = 0.2 m/s"
                            },
                            {
                              year: 2022,
                              question: "Derive the expression for velocity at any time t in projectile motion.",
                              marks: 5,
                              answer: "v_x = ucosα (constant), v_y = usinα - gt. Therefore v = √(u²cos²α + (usinα - gt)²)"
                            }
                          ],
                          mock_items: [
                            {
                              question: "The horizontal component of velocity in projectile motion is:",
                              options: ["Variable", "Constant", "Zero", "Maximum at top"],
                              answer: 1,
                              explanation: "Horizontal velocity remains constant because there is no horizontal acceleration (neglecting air resistance)."
                            }
                          ]
                        }
                      }
                    ]
                  },
                  {
                    id: "range-max-height-11",
                    slug: "range-max-height",
                    name: "Range and Maximum Height",
                    tier: "CoreConcept",
                    description: "Key parameters of projectile motion",
                    parent_id: "projectile-motion-11",
                    sort_order: 2,
                    children: [
                      {
                        id: "formulas-range",
                        slug: "formulas-range-max-height",
                        name: "Range and Height Formulas",
                        tier: "PracticalApp",
                        description: "Formulas for range and maximum height",
                        parent_id: "range-max-height-11",
                        sort_order: 1,
                        content: {
                          formulas: [
                            "R = u²sin(2θ)/g",
                            "H = u²sin²θ/(2g)",
                            "T = 2usinθ/g"
                          ],
                          numerals: [
                            {
                              problem: "A ball is projected with velocity 40 m/s at angle 30°. Find (a) maximum height, (b) range, (c) time of flight.",
                              solution: "Given: u = 40 m/s, θ = 30°, g = 9.8 m/s²\n(a) H = (40)²(sin30°)²/(2×9.8) = 1600×0.25/19.6 = 20.41 m\n(b) R = (40)²sin60°/9.8 = 1600×0.866/9.8 = 141.43 m\n(c) T = 2×40×sin30°/9.8 = 40/9.8 = 4.08 s",
                              steps: [
                                "Identify given values: u = 40 m/s, θ = 30°, g = 9.8 m/s²",
                                "Apply formula for maximum height: H = u²sin²θ/(2g)",
                                "Substitute values and calculate",
                                "Apply formula for range: R = u²sin(2θ)/g",
                                "Calculate range",
                                "Apply formula for time of flight: T = 2usinθ/g",
                                "Calculate time of flight"
                              ]
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              },
              {
                id: "newtons-laws-11",
                slug: "newtons-laws",
                name: "Newton's Laws of Motion",
                tier: "SubChapter",
                description: "Three fundamental laws of motion",
                parent_id: "kinematics-11",
                sort_order: 2,
                children: [
                  {
                    id: "first-law-11",
                    slug: "first-law",
                    name: "First Law (Inertia)",
                    tier: "CoreConcept",
                    description: "An object remains at rest or in uniform motion unless acted upon by external force",
                    parent_id: "newtons-laws-11",
                    sort_order: 1,
                    children: [
                      {
                        id: "notes-first-law",
                        slug: "notes-first-law",
                        name: "First Law Notes",
                        tier: "LearningAsset",
                        description: "Complete notes on Newton's First Law",
                        parent_id: "first-law-11",
                        sort_order: 1,
                        content: {
                          notes: "Newton's First Law states that every object continues in its state of rest or uniform motion in a straight line unless compelled to change that state by external forces. This tendency of objects to resist changes in their state of motion is called inertia.",
                          mind_map: "First Law -> Inertia -> Mass is measure of inertia -> Objects at rest stay at rest -> Objects in motion stay in motion (unless external force acts)",
                          summary: "Key concept: Inertia is the resistance to change in motion. More mass = more inertia."
                        }
                      },
                      {
                        id: "numericals-first-law",
                        slug: "numericals-first-law",
                        name: "First Law Numericals",
                        tier: "PracticalApp",
                        description: "Step-by-step numerical problems",
                        parent_id: "first-law-11",
                        sort_order: 2,
                        content: {
                          numerals: [
                            {
                              problem: "A book of mass 2 kg is placed on a table. What is the normal force exerted by the table?",
                              solution: "Given: m = 2 kg, g = 9.8 m/s²\nSince the book is at rest (equilibrium), Normal force = Weight = mg = 2 × 9.8 = 19.6 N",
                              steps: [
                                "Identify the object is at rest (equilibrium condition)",
                                "Apply Newton's First Law: Net force = 0",
                                "Normal force balances weight",
                                "Calculate: N = mg = 2 × 9.8 = 19.6 N"
                              ]
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id: "optics-11",
            slug: "optics",
            name: "Optics",
            tier: "Chapter",
            description: "Study of light and its properties",
            parent_id: "physics-11",
            sort_order: 2,
            children: [
              {
                id: "reflection-11",
                slug: "reflection",
                name: "Reflection of Light",
                tier: "SubChapter",
                description: "Reflection from plane and curved mirrors",
                parent_id: "optics-11",
                sort_order: 1,
                children: [
                  {
                    id: "mirror-formula-11",
                    slug: "mirror-formula",
                    name: "Mirror Formula",
                    tier: "CoreConcept",
                    description: "Relationship between object distance, image distance, and focal length",
                    parent_id: "reflection-11",
                    sort_order: 1,
                    children: [
                      {
                        id: "formula-mirror",
                        slug: "formula-mirror",
                        name: "Mirror Formula Derivation",
                        tier: "PracticalApp",
                        description: "Derivation and application of mirror formula",
                        parent_id: "mirror-formula-11",
                        sort_order: 1,
                        content: {
                          formulas: ["1/f = 1/v + 1/u", "m = -v/u", "f = R/2"],
                          numerals: [
                            {
                              problem: "An object is placed 20 cm from a concave mirror of focal length 10 cm. Find the position and nature of the image.",
                              solution: "Given: u = -20 cm, f = -10 cm\nUsing mirror formula: 1/v = 1/f - 1/u = -1/10 + 1/20 = -1/20\nTherefore v = -20 cm\nMagnification m = -v/u = -(-20)/(-20) = -1\nImage is real, inverted, and same size as object.",
                              steps: [
                                "Identify sign convention: concave mirror, f is negative",
                                "Write mirror formula: 1/f = 1/v + 1/u",
                                "Substitute values: 1/(-10) = 1/v + 1/(-20)",
                                "Solve for v: 1/v = -1/10 + 1/20 = -1/20",
                                "Calculate v = -20 cm",
                                "Find magnification: m = -v/u",
                                "Interpret result: negative v means real image"
                              ]
                            }
                          ]
                        }
                      },
                      {
                        id: "pyq-mirror",
                        slug: "pyq-mirror-formula",
                        name: "Mirror Formula PYQs",
                        tier: "Assessment",
                        description: "Previous year questions on mirror formula",
                        parent_id: "mirror-formula-11",
                        sort_order: 2,
                        content: {
                          pyqs: [
                            {
                              year: 2023,
                              question: "State the mirror formula and derive it for a concave mirror.",
                              marks: 5
                            },
                            {
                              year: 2022,
                              question: "A convex mirror has focal length 15 cm. If an object is placed 30 cm in front of it, find the position and nature of the image.",
                              marks: 5,
                              answer: "Using 1/v + 1/u = 1/f with f = +15 cm, u = -30 cm:\n1/v = 1/15 + 1/(-30) = 1/30\nv = +30/2 = +10 cm\nImage is virtual, erect, and diminished."
                            }
                          ],
                          practice_problems: [
                            {
                              question: "An object is placed 15 cm from a concave mirror of focal length 10 cm. Find the image distance and magnification.",
                              difficulty: "medium",
                              solution: "Using 1/v + 1/u = 1/f: 1/v = 1/(-10) - 1/(-15) = -1/30, so v = -30 cm\nm = -v/u = -(-30)/(-15) = -2 (real, inverted, magnified)"
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "chemistry-11",
        slug: "chemistry",
        name: "Chemistry",
        tier: "Subject",
        description: "Study of matter and its transformations",
        parent_id: "class-11",
        sort_order: 2,
        children: [
          {
            id: "stoichiometry-11",
            slug: "stoichiometry",
            name: "Stoichiometry",
            tier: "Chapter",
            description: "Quantitative relationships in chemical reactions",
            parent_id: "chemistry-11",
            sort_order: 1,
            children: [
              {
                id: "mole-concept-11",
                slug: "mole-concept",
                name: "Mole Concept",
                tier: "SubChapter",
                description: "Foundation of quantitative chemistry",
                parent_id: "stoichiometry-11",
                sort_order: 1,
                children: [
                  {
                    id: "formula-mole",
                    slug: "formula-mole",
                    name: "Mole Formulas",
                    tier: "PracticalApp",
                    description: "Key formulas for mole calculations",
                    parent_id: "mole-concept-11",
                    sort_order: 1,
                    content: {
                      formulas: [
                        "n = m/M (moles = mass/molar mass)",
                        "n = V/22.4 (for gases at STP)",
                        "n = N/Nₐ (moles = particles/Avogadro's number)",
                        "M = m/n (molar mass)"
                      ],
                      numerals: [
                        {
                          problem: "Calculate the number of moles in 36 g of water (H₂O).",
                          solution: "Given: mass = 36 g, M(H₂O) = 18 g/mol\nn = m/M = 36/18 = 2 moles",
                          steps: [
                            "Calculate molar mass of H₂O: 2(1) + 16 = 18 g/mol",
                            "Use formula: n = m/M",
                            "Substitute: n = 36/18",
                            "Result: n = 2 moles"
                          ]
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "mathematics-11",
        slug: "mathematics",
        name: "Mathematics",
        tier: "Subject",
        description: "Study of numbers, quantities, and shapes",
        parent_id: "class-11",
        sort_order: 3,
        children: [
          {
            id: "sets-11",
            slug: "sets",
            name: "Sets",
            tier: "Chapter",
            description: "Theory of sets and operations",
            parent_id: "mathematics-11",
            sort_order: 1,
            children: [
              {
                id: "types-of-sets-11",
                slug: "types-of-sets",
                name: "Types of Sets",
                tier: "SubChapter",
                description: "Empty set, finite, infinite, equal sets",
                parent_id: "sets-11",
                sort_order: 1,
                children: [
                  {
                    id: "notes-sets",
                    slug: "notes-types-of-sets",
                    name: "Types of Sets Notes",
                    tier: "LearningAsset",
                    description: "Complete notes on types of sets",
                    parent_id: "types-of-sets-11",
                    sort_order: 1,
                    content: {
                      notes: "A set is a well-defined collection of distinct objects. Types include: Empty Set (φ or {}), Finite Set (countable elements), Infinite Set (uncountable elements), Equal Sets (same elements), Subset (all elements of one set in another), Universal Set (contains all elements under consideration).",
                      summary: "Key definitions: Empty set has no elements. Finite sets have countable elements. Infinite sets have uncountable elements. Equal sets have exactly the same elements."
                    }
                  },
                  {
                    id: "formulas-sets",
                    slug: "formulas-sets",
                    name: "Set Formulas",
                    tier: "PracticalApp",
                    description: "Formulas for set operations",
                    parent_id: "types-of-sets-11",
                    sort_order: 2,
                    content: {
                      formulas: [
                        "n(A ∪ B) = n(A) + n(B) - n(A ∩ B)",
                        "n(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A∩B) - n(B∩C) - n(C∩A) + n(A∩B∩C)",
                        "n(A - B) = n(A) - n(A ∩ B)",
                        "n(U) = n(A) + n(A')"
                      ]
                    }
                  },
                  {
                    id: "pyq-sets",
                    slug: "pyq-types-of-sets",
                    name: "Sets PYQs",
                    tier: "Assessment",
                    description: "Previous year questions on sets",
                    parent_id: "types-of-sets-11",
                    sort_order: 3,
                    content: {
                      pyqs: [
                        {
                          year: 2023,
                          question: "If A = {1, 2, 3, 4, 5} and B = {3, 4, 5, 6, 7}, find (i) A ∪ B, (ii) A ∩ B, (iii) A - B.",
                          marks: 5,
                          answer: "(i) A ∪ B = {1, 2, 3, 4, 5, 6, 7}\n(ii) A ∩ B = {3, 4, 5}\n(iii) A - B = {1, 2}"
                        }
                      ],
                      practice_problems: [
                        {
                          question: "In a group of 50 students, 30 like mathematics, 25 like physics, and 10 like both. Find the number of students who like neither.",
                          difficulty: "medium",
                          solution: "n(M ∪ P) = n(M) + n(P) - n(M ∩ P) = 30 + 25 - 10 = 45\nNeither = 50 - 45 = 5 students"
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "class-12",
    slug: "class-12",
    name: "Class 12",
    tier: "Class",
    description: "Second year of +2 education under NEB curriculum",
    parent_id: null,
    sort_order: 2,
    children: [
      {
        id: "physics-12",
        slug: "physics",
        name: "Physics",
        tier: "Subject",
        description: "Advanced study of matter, energy, and their interactions",
        parent_id: "class-12",
        sort_order: 1,
        children: [
          {
            id: "electrostatics-12",
            slug: "electrostatics",
            name: "Electrostatics",
            tier: "Chapter",
            description: "Study of electric charges at rest",
            parent_id: "physics-12",
            sort_order: 1,
            children: [
              {
                id: "coulombs-law-12",
                slug: "coulombs-law",
                name: "Coulomb's Law",
                tier: "SubChapter",
                description: "Force between two point charges",
                parent_id: "electrostatics-12",
                sort_order: 1,
                children: [
                  {
                    id: "formula-coulomb",
                    slug: "formula-coulomb",
                    name: "Coulomb's Law Formula",
                    tier: "PracticalApp",
                    description: "Mathematical expression of Coulomb's law",
                    parent_id: "coulombs-law-12",
                    sort_order: 1,
                    content: {
                      formulas: [
                        "F = kq₁q₂/r²",
                        "k = 1/(4πε₀) = 9 × 10⁹ Nm²/C²",
                        "F = (1/4πε₀) × (q₁q₂/r²)"
                      ],
                      numerals: [
                        {
                          problem: "Two point charges of 2 μC and 3 μC are placed 0.1 m apart in vacuum. Find the force between them.",
                          solution: "Given: q₁ = 2 × 10⁻⁶ C, q₂ = 3 × 10⁻⁶ C, r = 0.1 m\nF = kq₁q₂/r² = 9×10⁹ × 2×10⁻⁶ × 3×10⁻⁶ / (0.1)²\nF = 9×10⁹ × 6×10⁻¹² / 0.01 = 5.4 N",
                          steps: [
                            "Identify given values and convert to SI units",
                            "Write Coulomb's law formula",
                            "Substitute values: F = 9×10⁹ × 2×10⁻⁶ × 3×10⁻⁶ / (0.1)²",
                            "Calculate numerator: 9×10⁹ × 6×10⁻¹² = 54×10⁻³",
                            "Divide by denominator: 54×10⁻³ / 0.01 = 5.4 N",
                            "Direction: Along the line joining the charges (repulsive since like charges)"
                          ]
                        }
                      ]
                    }
                  },
                  {
                    id: "pyq-coulomb",
                    slug: "pyq-coulombs-law",
                    name: "Coulomb's Law PYQs",
                    tier: "Assessment",
                    description: "Previous year questions",
                    parent_id: "coulombs-law-12",
                    sort_order: 2,
                    content: {
                      pyqs: [
                        {
                          year: 2023,
                          question: "State Coulomb's law and derive the expression for force between two point charges.",
                          marks: 5
                        },
                        {
                          year: 2022,
                          question: "Two charges 4 μC and -3 μC are placed 0.2 m apart. Calculate the force between them.",
                          marks: 5,
                          answer: "F = k|q₁q₂|/r² = 9×10⁹ × 4×10⁻⁶ × 3×10⁻⁶ / (0.2)² = 2.7 N (attractive)"
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

/**
 * Find a node by its slug
 */
export function findNodeBySlug(nodes: EducationNode[], slug: string): EducationNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    if (node.children) {
      const found = findNodeBySlug(node.children, slug);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all nodes at a specific tier
 */
export function getNodesByTier(nodes: EducationNode[], tier: EducationTier): EducationNode[] {
  const result: EducationNode[] = [];
  for (const node of nodes) {
    if (node.tier === tier) result.push(node);
    if (node.children) {
      result.push(...getNodesByTier(node.children, tier));
    }
  }
  return result;
}

/**
 * Get parent path to a node
 */
export function getPathToNode(
  nodes: EducationNode[],
  targetSlug: string,
  path: EducationNode[] = []
): EducationNode[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node];
    if (node.slug === targetSlug) return currentPath;
    if (node.children) {
      const found = getPathToNode(node.children, targetSlug, currentPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Flatten taxonomy to array with depth info
 */
export interface FlattenedNode extends EducationNode {
  depth: number;
  path: string;
}

export function flattenTaxonomy(
  nodes: EducationNode[],
  depth = 0,
  parentSlug = ""
): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  for (const node of nodes) {
    const path = parentSlug ? `${parentSlug}/${node.slug}` : node.slug;
    result.push({ ...node, depth, path });
    if (node.children) {
      result.push(...flattenTaxonomy(node.children, depth + 1, path));
    }
  }
  return result;
}

/**
 * Get all leaf nodes (nodes without children)
 */
export function getLeafNodes(nodes: EducationNode[]): EducationNode[] {
  const leaves: EducationNode[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      leaves.push(node);
    } else {
      leaves.push(...getLeafNodes(node.children));
    }
  }
  return leaves;
}

/**
 * Visual tree representation
 */
export function toTreeString(
  nodes: EducationNode[],
  prefix = "",
  isLast = true,
  isRoot = true
): string {
  let result = "";
  nodes.forEach((node, index) => {
    const isNodeLast = index === nodes.length - 1;
    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const tierIcon = {
      "Class": "📚",
      "Subject": "📖",
      "Chapter": "📋",
      "SubChapter": "📌",
      "CoreConcept": "💡",
      "LearningAsset": "📝",
      "PracticalApp": "🔧",
      "Assessment": "✅"
    }[node.tier] || "•";

    result += prefix + connector + tierIcon + ` ${node.name} (${node.tier})\n`;

    const newPrefix = prefix + (isRoot ? "" : isLast ? "    " : "│   ");
    if (node.children) {
      result += toTreeString(node.children, newPrefix, isNodeLast, false);
    }
  });
  return result;
}

/**
 * JSON output for API
 */
export function toTreeJSON(nodes: EducationNode[]): any {
  return nodes.map(node => ({
    id: node.id,
    slug: node.slug,
    name: node.name,
    tier: node.tier,
    description: node.description,
    hasContent: !!node.content,
    children: node.children ? toTreeJSON(node.children) : [],
  }));
}

/**
 * Get breadcrumb path as string
 */
export function getBreadcrumb(node: EducationNode, allNodes: EducationNode[]): string {
  const path = getPathToNode(allNodes, node.slug);
  if (!path) return node.name;
  return path.map(n => n.name).join(" → ");
}

/**
 * Get all nodes that have assessment content
 */
export function getAssessmentNodes(nodes: EducationNode[]): EducationNode[] {
  const assessments: EducationNode[] = [];
  for (const node of nodes) {
    if (node.content?.pyqs || node.content?.mock_items || node.content?.practice_problems) {
      assessments.push(node);
    }
    if (node.children) {
      assessments.push(...getAssessmentNodes(node.children));
    }
  }
  return assessments;
}

/**
 * Get all nodes that have practical applications
 */
export function getPracticalNodes(nodes: EducationNode[]): EducationNode[] {
  const practical: EducationNode[] = [];
  for (const node of nodes) {
    if (node.content?.formulas || node.content?.numerals) {
      practical.push(node);
    }
    if (node.children) {
      practical.push(...getPracticalNodes(node.children));
    }
  }
  return practical;
}
