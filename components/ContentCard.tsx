import Link from "next/link";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import type { ContentListItem } from "@/lib/types";

/**
 * Frontend defense-in-depth: masks a raw file URL on locked cards even if a
 * stale copy ever reaches the client. The API/RLS is the real gate; this is
 * the last line of defense.
 */
function maskRawFileUrl(isLocked: boolean, fileUrl?: string | null): string | null {
  if (!isLocked) return fileUrl ?? null;
  return "[Content URL hidden — requires access]";
}

export default function ContentCard({ item }: { item: ContentListItem }) {
  if (item.is_locked) {
    const contactHref =
      item.owner_contact?.includes("@")
        ? `mailto:${item.owner_contact}`
        : "mailto:ravikisan1814@gmail.com?subject=Content%20access%20request";

    const displayFileUrl = maskRawFileUrl(true, item.file_url);
    const maskedTitle = item.masked_title ?? "Locked content";

    return (
      <article className="card card-locked" data-testid="content-card-locked">
        <div className="card-meta">
          <span className="card-category">
            {item.category_name ?? "General"}
          </span>
          <span className="badge badge-locked">Locked</span>
        </div>
        <h3 className="card-title">{maskedTitle}</h3>
        <p className="card-description">
          This content is available to the{" "}
          {ACCESS_LEVEL_LABELS[item.required_access_level]} tier and above.
        </p>

        {/* Masked file URL — raw URL is never rendered for locked cards */}
        {displayFileUrl && (
          <p
            className="card-description card-file-url-masked"
            data-testid="masked-file-url"
          >
            {displayFileUrl}
          </p>
        )}

        <div className="card-actions">
          <a className="btn btn-primary" href={contactHref} data-testid="access-it-button">
            Access it
          </a>
          <a
            className="btn btn-secondary"
            href={contactHref}
            data-testid="contact-owner-button"
          >
            Contact with owner
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="card" data-testid="content-card-unlocked">
      <div className="card-meta">
        <span className="card-category">
          {item.category_name ?? "General"}
        </span>
        <span className="badge badge-open">Free</span>
      </div>
      <h3 className="card-title">{item.title}</h3>
      <p className="card-description">{item.description ?? "No description."}</p>
      <div className="card-actions">
        <Link className="btn btn-primary" href={`/contents/${item.id}`}>
          Read
        </Link>
      </div>
    </article>
  );
}