import type { Offer } from "../types.js";

function formatSalary(offer: Offer): string {
  const b2b = offer.employmentTypes.find((e) => e.type === "b2b");
  const other = offer.employmentTypes[0];
  const et = b2b ?? other;
  if (!et || et.from == null) return "—";
  const range = et.to != null ? `${et.from}–${et.to}` : `${et.from}+`;
  return `${range} ${et.currency.toUpperCase()}/${et.unit} (${et.gross ? "gross" : "net"})`;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isLaterDate(value: string, comparison?: string): boolean {
  if (!comparison) return false;
  return new Date(value).getTime() > new Date(comparison).getTime();
}

interface Props {
  offer: Offer;
}

export default function OfferCard({ offer }: Props) {
  const url = `https://justjoin.it/offers/${offer.slug}`;
  const isRefreshed = isLaterDate(offer.publishedAt, offer.dbPublishedAt);

  return (
    <div className="offer-card">
      <div className="offer-card-header">
        <a href={url} target="_blank" rel="noreferrer" className="offer-title">
          {offer.title}
        </a>
        {offer.alreadyFetched && <span className="badge fetched">fetched</span>}
        {offer.isPromoted && <span className="badge promoted">promoted</span>}
      </div>
      <div className="offer-meta">
        <span className="company">{offer.companyName}</span>
        <span className="separator">·</span>
        <span>{offer.city || "Remote"}</span>
        <span className="separator">·</span>
        <span>{offer.workplaceType}</span>
      </div>
      <div className="offer-salary">{formatSalary(offer)}</div>
      <div className="offer-meta">
        <span className="muted">cat:</span> {offer.category.key}
        {offer.languages?.length > 0 && (
          <>
            <span className="separator">·</span>
            <span className="muted">lang:</span> {offer.languages.map((l) => `${l.code.toUpperCase()} ${l.level}`).join(", ")}
          </>
        )}
      </div>
      {offer.requiredSkills.length > 0 && (
        <div className="offer-skills muted">
          {offer.requiredSkills.map((s) => s.name).join(", ")}
        </div>
      )}
      <div className="offer-dates muted">
        <div>
          <span>JJI published at:</span>
          <span>
            <time dateTime={offer.publishedAt}>{formatDate(offer.publishedAt)}</time>
            {isRefreshed && <span className="offer-date-refreshed-dot" title="refreshed" />}
          </span>
        </div>
        <div>
          <span>DB published at:</span>
          {offer.dbPublishedAt ? <time dateTime={offer.dbPublishedAt}>{formatDate(offer.dbPublishedAt)}</time> : <span>—</span>}
        </div>
        <div>
          <span>DB seen at:</span>
          {offer.dbSeenAt ? <time dateTime={offer.dbSeenAt}>{formatDate(offer.dbSeenAt)}</time> : <span>—</span>}
        </div>
      </div>
    </div>
  );
}
