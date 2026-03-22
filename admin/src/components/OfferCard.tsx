import type { Offer } from "../types.js";

function formatSalary(offer: Offer): string {
  const b2b = offer.employmentTypes.find((e) => e.type === "b2b");
  const other = offer.employmentTypes[0];
  const et = b2b ?? other;
  if (!et || et.from == null) return "—";
  const range = et.to != null ? `${et.from}–${et.to}` : `${et.from}+`;
  return `${range} ${et.currency.toUpperCase()}/${et.unit} (${et.gross ? "gross" : "net"})`;
}

interface Props {
  offer: Offer;
}

export default function OfferCard({ offer }: Props) {
  const url = `https://justjoin.it/offers/${offer.slug}`;
  const publishedAt = new Date(offer.publishedAt).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="offer-card">
      <div className="offer-card-header">
        <a href={url} target="_blank" rel="noreferrer" className="offer-title">
          {offer.title}
        </a>
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
      {offer.requiredSkills.length > 0 && (
        <div className="offer-skills muted">
          {offer.requiredSkills.map((s) => s.name).join(", ")}
        </div>
      )}
      <div className="offer-date muted">{publishedAt}</div>
    </div>
  );
}
