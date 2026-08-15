"use client";

import type { AccessLevel } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";

interface LockedSectionProps {
  requiredAccessLevel: AccessLevel;
  ownerContact: string | null;
}

function contactHref(ownerContact: string | null): string {
  if (ownerContact && ownerContact.includes("@")) {
    return `mailto:${ownerContact}?subject=Content%20access%20request`;
  }
  return "mailto:ravikisan1814@gmail.com?subject=Content%20access%20request";
}

/**
 * The tier-gated 90% body of a topic page.
 *
 * Security rules:
 *   - The raw locked_payload/variants never reach this component when the
 *     item is locked (the API only returns null for those fields), so the
 *     blur overlay covers a placeholder skeleton — there is literally nothing
 *     to extract from client state or the DOM.
 *   - The overlay carries an inline gradient blur (a "peek" look that keeps
 *     the 10% cleanly separated) and the two required actions:
 *       [ Access it ]  [ Contact with owner ]
 */
export default function LockedSection({
  requiredAccessLevel,
  ownerContact,
}: LockedSectionProps) {
  return (
    <div className="locked-section" data-testid="locked-section">
      {/* Placeholder skeleton — never the real payload. The blur overlay
          sits on top; there is no raw content in the DOM/client state. */}
      <div className="locked-placeholder" aria-hidden="true">
        <p className="locked-placeholder-line" />
        <p className="locked-placeholder-line" />
        <p className="locked-placeholder-line short" />
        <p className="locked-placeholder-line" />
        <p className="locked-placeholder-line short" />
      </div>

      <div className="locked-overlay">
        <p className="locked-overlay-label">
          Full notes · Statements · Bullet points · Worked examples · PYQs
        </p>
        <p className="locked-overlay-tier">
          This content is available to the{" "}
          <strong>{ACCESS_LEVEL_LABELS[requiredAccessLevel]}</strong> tier and
          above.
        </p>
        <p className="locked-overlay-mail" data-testid="locked-owner-mail">
          Contact with owner:{" "}
          <a href={contactHref(ownerContact)}>
            {ownerContact && ownerContact.includes("@")
              ? ownerContact
              : "ravikisan1814@gmail.com"}
          </a>
        </p>
        <div className="locked-actions">
          <a
            className="btn btn-primary"
            href={contactHref(ownerContact)}
            data-testid="locked-access-it"
          >
            Access it
          </a>
          <a
            className="btn btn-secondary"
            href={contactHref(ownerContact)}
            data-testid="locked-contact-owner"
          >
            Contact with owner
          </a>
        </div>
      </div>
    </div>
  );
}