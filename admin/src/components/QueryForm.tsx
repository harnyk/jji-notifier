import { useState } from "react";
import type { SearchQuery, Offer } from "../types.js";
import { createQuery, previewQuery } from "../api.js";
import OfferCard from "./OfferCard.js";

const CATEGORIES = [
  "javascript", "html", "php", "ruby", "python", "java", "net", "scala", "go", "c",
  "mobile", "data", "ai", "devops", "testing", "security", "game",
  "architecture", "analytics", "ux", "pm", "admin", "support", "erp", "other",
];
const EXPERIENCE_LEVELS = ["junior", "mid", "senior", "c_level"];
const EMPLOYMENT_TYPES  = ["b2b", "permanent", "mandate_contract", "specific_task_contract", "internship"];
const REMOTE_OPTIONS    = ["remote", "hybrid", "office"];
const WORKING_TIME      = ["full_time", "part_time", "freelance", "internship", "practice_internship"];
const CURRENCIES = ["pln", "eur", "usd", "gbp", "chf"];

const CATEGORY_ABBREV: Record<string, string> = {
  javascript: "JS", html: "HTML", php: "PHP", ruby: "Ruby", python: "Python",
  java: "Java", net: ".NET", scala: "Scala", go: "Go", c: "C/C++",
  mobile: "Mobile", data: "Data", ai: "AI", devops: "DevOps", testing: "QA",
  security: "Sec", game: "Game", architecture: "Arch", analytics: "Analytics",
  ux: "UX", pm: "PM", admin: "Admin", support: "Support", erp: "ERP", other: "Other",
};

function generateLabel(config: SearchQuery): string {
  const parts: string[] = [
    config.experienceLevels?.join("/"),
    config.categories?.map((c) => CATEGORY_ABBREV[c] ?? c).join("/"),
    config.remoteWorkOptions?.join("/"),
    config.employmentTypes?.join("/"),
    config.keywords ? `"${config.keywords}"` : undefined,
  ].filter((p): p is string => Boolean(p));
  return parts.join(" ") || "New Query";
}

const DEFAULT_CONFIG: SearchQuery = {
  from: 0,
  itemsCount: 200,
  orderBy: "descending",
  sortBy: "publishedAt",
  categories: ["javascript"],
  experienceLevels: ["senior"],
  employmentTypes: ["b2b"],
  remoteWorkOptions: ["remote"],
  currency: "pln",
};

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

interface CheckboxGroupProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}

function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="checkbox-group">
        {options.map((opt) => (
          <label key={opt} className="checkbox-label">
            <input
              type="checkbox"
              checked={value.includes(opt)}
              onChange={() => onChange(toggleItem(value, opt))}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function QueryForm({ onCreated, onCancel }: Props) {
  const [config, setConfig] = useState<SearchQuery>(DEFAULT_CONFIG);
  const [label, setLabel] = useState(() => generateLabel(DEFAULT_CONFIG));
  const [labelManual, setLabelManual] = useState(false);
  const [preview, setPreview] = useState<Offer[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SearchQuery>(key: K, value: SearchQuery[K]) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    if (!labelManual) setLabel(generateLabel(next));
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const result = await previewQuery(config);
      setPreview(result.offers);
      setPreviewTotal(result.total);
    } catch (e) {
      setError(String(e));
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createQuery(label.trim(), config);
      onCreated();
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  };

  return (
    <div className="form-page">
      <div className="form-panel">
        <div className="form-header">
          <h2>Create search query</h2>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <div className="form-body">
          <div className="form-section">
            <div className="form-section-title">General</div>

            <div className="field">
              <label className="field-label">
                Name
                {labelManual && (
                  <button
                    className="btn-ghost label-reset"
                    onClick={() => { setLabelManual(false); setLabel(generateLabel(config)); }}
                    title="Reset to auto-generated"
                  >
                    ↺ reset to auto
                  </button>
                )}
              </label>
              <input
                className={`input ${labelManual ? "" : "input-auto"}`}
                type="text"
                value={label}
                onChange={(e) => { setLabel(e.target.value); setLabelManual(true); }}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Filters</div>

            <CheckboxGroup
              label="Categories"
              options={CATEGORIES}
              value={config.categories ?? []}
              onChange={(v) => set("categories", v)}
            />

            <CheckboxGroup
              label="Experience level"
              options={EXPERIENCE_LEVELS}
              value={config.experienceLevels ?? []}
              onChange={(v) => set("experienceLevels", v)}
            />

            <CheckboxGroup
              label="Employment type"
              options={EMPLOYMENT_TYPES}
              value={config.employmentTypes ?? []}
              onChange={(v) => set("employmentTypes", v)}
            />

            <CheckboxGroup
              label="Remote"
              options={REMOTE_OPTIONS}
              value={config.remoteWorkOptions ?? []}
              onChange={(v) => set("remoteWorkOptions", v)}
            />

            <CheckboxGroup
              label="Working time"
              options={WORKING_TIME}
              value={config.workingTimes ?? []}
              onChange={(v) => set("workingTimes", v)}
            />
          </div>

          <div className="form-section">
            <div className="form-section-title">Options</div>

            <div className="field-row">
              <div className="field">
                <label className="field-label">Currency</label>
                <select
                  className="input"
                  value={config.currency ?? "pln"}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">City radius (km)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={config.cityRadius ?? ""}
                  onChange={(e) =>
                    set("cityRadius", e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Keywords</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. backend, node.js"
                value={config.keywords ?? ""}
                onChange={(e) => set("keywords", e.target.value || undefined)}
              />
                </div>
          </div>{/* /form-section Options */}
        </div>{/* /form-body */}

        <div className="form-footer">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Creating query…" : "Create query"}
          </button>
          <button className="btn-secondary" onClick={handlePreview} disabled={previewing}>
            {previewing ? "Loading…" : "Preview results"}
          </button>
        </div>
      </div>{/* /form-panel */}

      <div className="preview-panel">
        {preview === null ? (
          <div className="empty-state">
            <p>Click Preview to see matching offers.</p>
          </div>
        ) : (
          <>
            <div className="preview-header">
              <strong>{previewTotal}</strong> offers found
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
