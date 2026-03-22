import type { QueryDoc } from "../types.js";

interface Props {
  queries: QueryDoc[];
  selectedId: string | null;
  onSelect: (query: QueryDoc) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onArchive: (id: string) => void;
}

export default function QueryList({ queries, selectedId, onSelect, onToggleActive, onArchive }: Props) {
  const nonArchived = queries.filter((q) => !q.isArchived);
  const archived    = queries.filter((q) => q.isArchived);

  if (queries.length === 0) {
    return <p className="muted sidebar-msg">No queries yet. Create one!</p>;
  }

  return (
    <div className="query-list">
      {nonArchived.map((q) => (
        <QueryItem
          key={q._id}
          query={q}
          selected={q._id === selectedId}
          onSelect={onSelect}
          onToggleActive={onToggleActive}
          onArchive={onArchive}
        />
      ))}

      {archived.length > 0 && (
        <details className="archived-section">
          <summary>Archived ({archived.length})</summary>
          {archived.map((q) => (
            <QueryItem
              key={q._id}
              query={q}
              selected={q._id === selectedId}
              onSelect={onSelect}
              onToggleActive={onToggleActive}
              onArchive={onArchive}
            />
          ))}
        </details>
      )}
    </div>
  );
}

interface ItemProps {
  query: QueryDoc;
  selected: boolean;
  onSelect: (query: QueryDoc) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onArchive: (id: string) => void;
}

function QueryItem({ query, selected, onSelect, onToggleActive, onArchive }: ItemProps) {
  const cfg = query.config;
  const summary = [
    cfg.categories?.join(", "),
    cfg.experienceLevels?.join(", "),
    cfg.remoteWorkOptions?.join(", "),
  ].filter(Boolean).join(" · ");

  const badge = query.isArchived
    ? <span className="badge archived">Archived</span>
    : !query.isBootstrapped
      ? <span className="badge pending">Bootstrapping</span>
      : query.isActive
        ? <span className="badge active">Active</span>
        : <span className="badge inactive">Inactive</span>;

  return (
    <div
      className={`query-item ${query.isArchived ? "archived" : ""} ${selected ? "selected" : ""}`}
      onClick={() => onSelect(query)}
    >
      <div className="query-item-header">
        <span className="query-label">{query.label}</span>
        {badge}
      </div>
      <div className="query-summary">{summary}</div>
      {cfg.keywords && <div className="query-keywords">"{cfg.keywords}"</div>}
      {!query.isArchived && query.isBootstrapped && (
        <div className="query-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className={`btn-ghost btn-sm ${query.isActive ? "btn-deactivate" : "btn-activate"}`}
            onClick={() => onToggleActive(query._id, !query.isActive)}
          >
            {query.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            className="btn-ghost btn-sm"
            onClick={() => { if (confirm(`Archive "${query.label}"?`)) onArchive(query._id); }}
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
