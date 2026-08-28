"use client";

import { useState } from "react";
import { TAXONOMY } from "@/lib/taxonomy";
import type { TaxonomyNode } from "@/lib/taxonomy";

export default function TaxonomyTree() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["neb", "loksewa"]));

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="taxonomy-tree-view">
      <h2>Interactive Taxonomy Tree</h2>
      <TreeNodes nodes={TAXONOMY} expandedNodes={expandedNodes} onToggle={toggleNode} depth={0} />
    </div>
  );
}

function TreeNodes({ 
  nodes, 
  expandedNodes, 
  onToggle, 
  depth 
}: { 
  nodes: TaxonomyNode[]; 
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  depth: number;
}) {
  return (
    <ul className={`tree-view-list depth-${depth}`}>
      {nodes.map((node) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        
        return (
          <li key={node.id} className="tree-view-item">
            <div className="tree-node-header">
              <button 
                className="toggle-btn"
                onClick={() => hasChildren && onToggle(node.id)}
                disabled={!hasChildren}
                aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
              >
                {hasChildren ? (isExpanded ? "▼" : "▶") : "•"}
              </button>
              <span className="node-icon">{getNodeIcon(node.tier)}</span>
              <span className="node-name">{node.name}</span>
              <span className={`tier-badge ${node.tier.toLowerCase()}`}>{node.tier}</span>
            </div>
            {hasChildren && isExpanded && (
              <ul className="tree-children">
                <TreeNodes 
                  nodes={node.children!} 
                  expandedNodes={expandedNodes} 
                  onToggle={onToggle} 
                  depth={depth + 1} 
                />
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function getNodeIcon(tier: string): string {
  const icons: Record<string, string> = {
    "Domain": "🌍",
    "Kingdom": "👑",
    "Phylum": "🔬",
    "Class": "📊",
    "Order": "📋",
    "Family": "👨‍👩‍👧‍👦",
    "Genus": "🏷️",
    "Species": "🌱",
  };
  return icons[tier] || "•";
}
