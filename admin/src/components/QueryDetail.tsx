import { useState, useEffect } from "react";
import type { QueryDoc, Offer } from "../types.js";
import { previewQuery } from "../api.js";
import OfferCard from "./OfferCard.js";

const CATEGORY_ABBREV: Record<string, string> = {
  javascript: "JS", html: "HTML", php: "PHP", ruby: "Ruby", python: "Python",
  java: "Java", net: ".NET", scala: "Scala", go: "Go", c: "C/C++",
  mobile: "Mobile", data: "Data", ai: "AI", devops: "DevOps", testing: "QA",
  security: "Sec", game: "Game", architecture: "Arch", analytics: "Analytics",
  ux: "UX", pm: "PM", admin: "Admin", support: "Support", erp: "ERP", other: "Other",
};

interface Props {
  query: QueryDoc;
  onToggleActive: (id: string, isActive: boolean) => void;
  onArchive: (id: string) => void;
  onClone: (query: QueryDoc) => void;
}

function Tags({ values, all, abbrev }: { values: string[]; all: string[]; abbrev?: Record<string, string> }) {
  return (
    <div className="tag-group">
      {all.map((v) => {
        const selected = values.includes(v);
        return (
          <span key={v} className={`tag ${selected ? "tag-on" : "tag-off"}`}>
            {abbrev?.[v] ?? v}
          </span>
        );
      })}
    </div>
  );
}

const ALL_CATEGORIES    = ["javascript","html","php","ruby","python","java","net","scala","go","c","mobile","data","ai","devops","testing","security","game","architecture","analytics","ux","pm","admin","support","erp","other"];
const ALL_LEVELS        = ["junior","mid","senior","c_level"];
const ALL_EMPLOYMENT    = ["b2b","permanent","mandate_contract","specific_task_contract","internship"];
const ALL_REMOTE        = ["remote","hybrid","office"];
const ALL_WORKING_TIME  = ["full_time","part_time","freelance","internship","practice_internship"];

export default function QueryDetail({ query, onToggleActive, onArchive, onClone }: Props) {
  const [preview, setPreview] = useState<Offer[] | null>(null);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Load preview automatically when query changes
  useEffect(() => {
    setPreview(null);
    setError(null);
    setLoading(true);
    previewQuery(query.config)
      .then((r) => { setPreview(r.offers); setTotal(r.total); })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [query._id]);

  const cfg = query.config;

  const statusBadge = query.isArchived
    ? <span className="badge archived">Archived</span>
    : !query.isBootstrapped
      ? <span className="badge pending">Bootstrapping</span>
      : query.isActive
        ? <span className="badge active">Active</span>
        : <span className="badge inactive">Inactive</span>;

  return (
    <div className="form-page">
      {/* Left: readonly config */}
      <div className="form-panel">
        <div className="form-header">
          <div className="detail-title">
            <h2>{query.label}</h2>
            {statusBadge}
          </div>
        </div>

        <div className="form-body">
          <div className="form-section">
            <div className="form-section-title">Filters</div>

            <div className="field">
              <label className="field-label">Categories</label>
              <Tags values={cfg.categories ?? []} all={ALL_CATEGORIES} abbrev={CATEGORY_ABBREV} />
            </div>

            <div className="field">
              <label className="field-label">Experience level</label>
              <Tags values={cfg.experienceLevels ?? []} all={ALL_LEVELS} />
            </div>

            <div className="field">
              <label className="field-label">Employment type</label>
              <Tags values={cfg.employmentTypes ?? []} all={ALL_EMPLOYMENT} />
            </div>

            <div className="field">
              <label className="field-label">Remote</label>
              <Tags values={cfg.remoteWorkOptions ?? []} all={ALL_REMOTE} />
            </div>

            <div className="field">
              <label className="field-label">Working time</label>
              <Tags values={cfg.workingTimes ?? []} all={ALL_WORKING_TIME} />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Options</div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Currency</label>
                <span className="detail-value">{cfg.currency?.toUpperCase() ?? "—"}</span>
              </div>
              <div className="field">
                <label className="field-label">City radius</label>
                <span className="detail-value">{cfg.cityRadius != null ? `${cfg.cityRadius} km` : "—"}</span>
              </div>
            </div>

            {cfg.keywords && (
              <div className="field">
                <label className="field-label">Keywords</label>
                <span className="detail-value">"{cfg.keywords}"</span>
              </div>
            )}
          </div>
        </div>

        <div className="form-footer">
          {!query.isArchived && query.isBootstrapped && (
            <>
              <button
                className={`btn-primary ${query.isActive ? "btn-danger" : ""}`}
                onClick={() => onToggleActive(query._id, !query.isActive)}
              >
                {query.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => { if (confirm(`Archive "${query.label}"?`)) onArchive(query._id); }}
              >
                Archive
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => onClone(query)}>
            Clone
          </button>
        </div>
      </div>

      {/* Right: preview */}
      <div className="preview-panel">
        {loading && (
          <div className="preview-header">Loading offers…</div>
        )}
        {error && (
          <div className="error-box">{error}</div>
        )}
        {!loading && preview !== null && (
          <>
            <div className="preview-header">
              <strong>{total}</strong> offers match this query
            </div>
            <div className="offer-list">
              {preview.map((offer) => (
                <OfferCard key={offer.guid} offer={offer} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
