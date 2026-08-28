/**
 * Educational Content Taxonomy System
 * 
 * This module defines the hierarchical classification system for all educational content.
 * Uses a strict Domain -> Kingdom -> Phylum -> Class -> Order -> Family -> Genus -> Species model.
 */

export type Tier = "Domain" | "Kingdom" | "Phylum" | "Class" | "Order" | "Family" | "Genus" | "Species";

export interface TaxonomyNode {
  id: string;
  slug: string;
  name: string;
  tier: Tier;
  description?: string;
  parent_id: string | null;
  sort_order: number;
  children?: TaxonomyNode[];
  metadata?: Record<string, unknown>;
}

/**
 * Root taxonomy structure for the educational platform
 */
export const TAXONOMY: TaxonomyNode[] = [
  {
    id: "neb",
    slug: "neb",
    name: "NEB (+2)",
    tier: "Domain",
    description: "National Examination Board - Class 11 & 12",
    parent_id: null,
    sort_order: 1,
    children: [
      {
        id: "class-11",
        slug: "class-11",
        name: "Class 11",
        tier: "Kingdom",
        description: "First year of +2 education",
        parent_id: "neb",
        sort_order: 1,
        children: [
          {
            id: "science",
            slug: "science",
            name: "Science Group",
            tier: "Phylum",
            description: "Science stream subjects",
            parent_id: "class-11",
            sort_order: 1,
            children: [
              {
                id: "physics",
                slug: "physics",
                name: "Physics",
                tier: "Class",
                description: "Mechanics, optics, electricity, modern physics",
                parent_id: "science",
                sort_order: 1,
                children: [
                  {
                    id: "mechanics",
                    slug: "mechanics",
                    name: "Mechanics",
                    tier: "Order",
                    description: "Motion, forces, energy",
                    parent_id: "physics",
                    sort_order: 1,
                    children: [
                      {
                        id: "kinematics",
                        slug: "kinematics",
                        name: "Kinematics",
                        tier: "Family",
                        description: "Description of motion",
                        parent_id: "mechanics",
                        sort_order: 1,
                        children: [
                          {
                            id: "types-of-motion",
                            slug: "types-of-motion",
                            name: "Types of Motion",
                            tier: "Genus",
                            description: "Linear, circular, periodic motion",
                            parent_id: "kinematics",
                            sort_order: 1,
                            children: [
                              {
                                id: "linear-motion",
                                slug: "linear-motion",
                                name: "Linear Motion",
                                tier: "Species",
                                description: "Motion in a straight line",
                                parent_id: "types-of-motion",
                                sort_order: 1,
                              },
                              {
                                id: "circular-motion",
                                slug: "circular-motion",
                                name: "Circular Motion",
                                tier: "Species",
                                description: "Motion in a circular path",
                                parent_id: "types-of-motion",
                                sort_order: 2,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: "optics",
                    slug: "optics",
                    name: "Optics",
                    tier: "Order",
                    description: "Light, reflection, refraction",
                    parent_id: "physics",
                    sort_order: 2,
                    children: [
                      {
                        id: "reflection",
                        slug: "reflection",
                        name: "Reflection",
                        tier: "Family",
                        description: "Mirrors and reflection",
                        parent_id: "optics",
                        sort_order: 1,
                        children: [
                          {
                            id: "mirror-formula",
                            slug: "mirror-formula",
                            name: "Mirror Formula",
                            tier: "Genus",
                            description: "1/f = 1/v + 1/u",
                            parent_id: "reflection",
                            sort_order: 1,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                id: "chemistry",
                slug: "chemistry",
                name: "Chemistry",
                tier: "Class",
                description: "Physical, organic, inorganic chemistry",
                parent_id: "science",
                sort_order: 2,
                children: [
                  {
                    id: "physical-chemistry",
                    slug: "physical-chemistry",
                    name: "Physical Chemistry",
                    tier: "Order",
                    description: "Thermodynamics, kinetics, equilibrium",
                    parent_id: "chemistry",
                    sort_order: 1,
                  },
                  {
                    id: "organic-chemistry",
                    slug: "organic-chemistry",
                    name: "Organic Chemistry",
                    tier: "Order",
                    description: "Carbon compounds, reactions",
                    parent_id: "chemistry",
                    sort_order: 2,
                  },
                ],
              },
              {
                id: "mathematics",
                slug: "mathematics",
                name: "Mathematics",
                tier: "Class",
                description: "Algebra, calculus, geometry, statistics",
                parent_id: "science",
                sort_order: 3,
                children: [
                  {
                    id: "algebra",
                    slug: "algebra",
                    name: "Algebra",
                    tier: "Order",
                    description: "Equations, matrices, determinants",
                    parent_id: "mathematics",
                    sort_order: 1,
                  },
                  {
                    id: "calculus",
                    slug: "calculus",
                    name: "Calculus",
                    tier: "Order",
                    description: "Limits, derivatives, integrals",
                    parent_id: "mathematics",
                    sort_order: 2,
                  },
                ],
              },
              {
                id: "biology",
                slug: "biology",
                name: "Biology",
                tier: "Class",
                description: "Life sciences, ecology, genetics",
                parent_id: "science",
                sort_order: 4,
              },
            ],
          },
          {
            id: "management",
            slug: "management",
            name: "Management Group",
            tier: "Phylum",
            description: "Management stream subjects",
            parent_id: "class-11",
            sort_order: 2,
          },
          {
            id: "humanities",
            slug: "humanities",
            name: "Humanities Group",
            tier: "Phylum",
            description: "Humanities stream subjects",
            parent_id: "class-11",
            sort_order: 3,
          },
        ],
      },
      {
        id: "class-12",
        slug: "class-12",
        name: "Class 12",
        tier: "Kingdom",
        description: "Second year of +2 education",
        parent_id: "neb",
        sort_order: 2,
      },
    ],
  },
  {
    id: "loksewa",
    slug: "loksewa",
    name: "Loksewa",
    tier: "Domain",
    description: "Public Service Commission Exam Preparation",
    parent_id: null,
    sort_order: 2,
    children: [
      {
        id: "general-knowledge",
        slug: "general-knowledge",
        name: "General Knowledge",
        tier: "Kingdom",
        description: "Current affairs, history, geography",
        parent_id: "loksewa",
        sort_order: 1,
      },
      {
        id: "governance",
        slug: "governance",
        name: "Governance & Public Admin",
        tier: "Kingdom",
        description: "Constitution, administration, law",
        parent_id: "loksewa",
        sort_order: 2,
      },
    ],
  },
  {
    id: "world-knowledge",
    slug: "world-knowledge",
    name: "World Knowledge",
    tier: "Domain",
    description: "Global awareness and general studies",
    parent_id: null,
    sort_order: 3,
  },
];

/**
 * Find a node by its slug
 */
export function findNodeBySlug(nodes: TaxonomyNode[], slug: string): TaxonomyNode | null {
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
export function getNodesByTier(nodes: TaxonomyNode[], tier: Tier): TaxonomyNode[] {
  const result: TaxonomyNode[] = [];
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
export function getPathToNode(nodes: TaxonomyNode[], targetSlug: string, path: TaxonomyNode[] = []): TaxonomyNode[] | null {
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
export interface FlattenedNode extends TaxonomyNode {
  depth: number;
  path: string;
}

export function flattenTaxonomy(nodes: TaxonomyNode[], depth = 0, parentSlug = ""): FlattenedNode[] {
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
export function getLeafNodes(nodes: TaxonomyNode[]): TaxonomyNode[] {
  const leaves: TaxonomyNode[] = [];
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
export function toTreeString(nodes: TaxonomyNode[], prefix = "", isLast = true, isRoot = true): string {
  let result = "";
  nodes.forEach((node, index) => {
    const isNodeLast = index === nodes.length - 1;
    const connector = isRoot ? "" : isLast ? "└── " : "├── ";
    const tierIcon = {
      "Domain": "🌍",
      "Kingdom": "👑",
      "Phylum": "🔬",
      "Class": "📊",
      "Order": "📋",
      "Family": "👨‍👩‍👧‍👦",
      "Genus": "🏷️",
      "Species": "🌱"
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
export function toTreeJSON(nodes: TaxonomyNode[]): any {
  return nodes.map(node => ({
    id: node.id,
    slug: node.slug,
    name: node.name,
    tier: node.tier,
    description: node.description,
    children: node.children ? toTreeJSON(node.children) : [],
  }));
}
