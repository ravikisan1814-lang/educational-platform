"use client";

interface VariantTabsProps {
  labels: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  locked: boolean;
}

/**
 * Interactive multi-type tab bar ([ Type 1 ] [ Type 2 ] [ Type 3 ]).
 *
 * - Type 1 is the canonical locked_payload.
 * - Type 2+ come from content_items.variants (JSONB) via the DB gate.
 * - When the item is locked, the tabs are still rendered (labels only) so
 *   visitors can see the variation structure, but switching does NOT reveal
 *   content — the locked-section blur overlay stays in place.
 */
export default function VariantTabs({
  labels,
  activeIndex,
  onSelect,
  locked,
}: VariantTabsProps) {
  if (!labels || labels.length === 0) {
    return null;
  }

  return (
    <div
      className="variant-tabs"
      role="tablist"
      aria-label="Content variants"
      data-testid="variant-tabs"
    >
      {labels.map((label, index) => {
        const selected = index === activeIndex;
        return (
          <button
            key={`${label}-${index}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="variant-panel"
            id={`variant-tab-${index}`}
            className={`variant-tab${selected ? " variant-tab-active" : ""}${
              locked ? " variant-tab-locked" : ""
            }`}
            data-testid={`variant-tab-${index}`}
            onClick={() => onSelect(index)}
          >
            {label}
            {locked && <span className="variant-tab-lock">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}