"use client";

import { useState } from "react";
import { TAXONOMY, findNodeBySlug, getLeafNodes } from "@/lib/taxonomy";
import type { TaxonomyNode } from "@/lib/taxonomy";

export default function TaxonomyExplorer() {
  const [selectedNode, setSelectedNode] = useState<TaxonomyNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleNodeClick = (node: TaxonomyNode) => {
    setSelectedNode(node);
  };

  const filteredNodes = searchTerm
    ? TAXONOMY.filter(n => 
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : TAXONOMY;

  return (
    <div className="taxonomy-explorer">
      <div className="explorer-controls">
        <input
          type="text"
          placeholder="Search taxonomy..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={() => setSelectedNode(null)} className="btn btn-secondary btn-sm">
          Clear Selection
        </button>
      </div>

      <div className="explorer-layout">
        <div className="taxonomy-tree">
          <TreeNodes nodes={filteredNodes} onSelect={handleNodeClick} selectedId={selectedNode?.id} />
        </div>

        {selectedNode && (
          <div className="node-details">
            <div className="detail-header">
              <span className={`tier-badge ${selectedNode.tier.toLowerCase()}`}>
                {selectedNode.tier}
              </span>
              <h2>{selectedNode.name}</h2>
            </div>
            {selectedNode.description && (
              <p className="detail-description">{selectedNode.description}</p>
            )}
            <div className="detail-meta">
              <div className="meta-item">
                <strong>Slug:</strong> <code>{selectedNode.slug}</code>
              </div>
              <div className="meta-item">
                <strong>Depth:</strong> {selectedNode.tier} level
              </div>
              {selectedNode.children && selectedNode.children.length > 0 && (
                <div className="meta-item">
                  <strong>Children:</strong> {selectedNode.children.length}
                </div>
              )}
            </div>
            <div className="detail-actions">
              <button className="btn btn-primary btn-sm">
                View Content
              </button>
              <button className="btn btn-secondary btn-sm">
                Add Bookmark
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TreeNodes({ 
  nodes, 
  onSelect, 
  selectedId 
}: { 
  nodes: TaxonomyNode[]; 
  onSelect: (node: TaxonomyNode) => void;
  selectedId?: string;
}) {
  return (
    <ul className="tree-list">
      {nodes.map((node) => (
        <li key={node.id} className="tree-item">
          <button
            className={`tree-node${selectedId === node.id ? " selected" : ""}`}
            onClick={() => onSelect(node)}
          >
            <span className="node-icon">{getNodeIcon(node.tier)}</span>
            <span className="node-name">{node.name}</span>
            {node.children && node.children.length > 0 && (
              <span className="node-count">{node.children.length}</span>
            )}
          </button>
          {node.children && node.children.length > 0 && (
            <ul className="tree-children">
              <TreeNodes nodes={node.children} onSelect={onSelect} selectedId={selectedId} />
            </ul>
          )}
        </li>
      ))}
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
