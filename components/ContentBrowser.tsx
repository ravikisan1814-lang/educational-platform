"use client";

import { useState } from "react";
import { TAXONOMY, findNodeBySlug, flattenTaxonomy } from "@/lib/taxonomy";
import type { TaxonomyNode, FlattenedNode } from "@/lib/taxonomy";

export default function ContentBrowser() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const allNodes = flattenTaxonomy(TAXONOMY);
  const leafNodes = allNodes.filter(n => n.depth >= 5);

  const filteredNodes = leafNodes.filter(node => {
    const matchesLevel = selectedLevel === "all" || node.tier === selectedLevel;
    const matchesSearch = !searchTerm || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.slug.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const levels = ["all", "Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"];

  return (
    <div className="content-browser">
      <div className="browser-controls">
        <input
          type="text"
          placeholder="Search content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={selectedLevel} 
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="level-select"
        >
          {levels.map(l => (
            <option key={l} value={l}>{l === "all" ? "All Levels" : l + "s"}</option>
          ))}
        </select>
      </div>

      <div className="content-grid">
        {filteredNodes.map(node => (
          <div key={node.id} className="content-card">
            <div className="card-tier">
              <span className={`tier-tag ${node.tier.toLowerCase()}`}>{node.tier}</span>
              <span className="card-depth">Depth: {node.depth}</span>
            </div>
            <h3 className="card-title">{node.name}</h3>
            {node.description && (
              <p className="card-desc">{node.description}</p>
            )}
            <div className="card-path">
              <code>{node.path}</code>
            </div>
            <div className="card-actions">
              <button className="btn btn-primary btn-sm">View</button>
              <button className="btn btn-secondary btn-sm">Bookmark</button>
            </div>
          </div>
        ))}
      </div>

      {filteredNodes.length === 0 && (
        <div className="empty-state">
          <p>No content found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
