import { useState, useEffect, useCallback } from "react";
import type { QueryDoc } from "./types.js";
import { getQueries, archiveQuery, setQueryActive } from "./api.js";
import QueryList from "./components/QueryList.js";
import QueryForm from "./components/QueryForm.js";
import QueryDetail from "./components/QueryDetail.js";

type View = "empty" | "new" | "detail";

export default function App() {
  const [queries, setQueries] = useState<QueryDoc[]>([]);
  const [view, setView] = useState<View>("empty");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueries = useCallback(async () => {
    try {
      setError(null);
      const data = await getQueries();
      setQueries(data);
      return data;
    } catch {
      setError("Failed to load queries");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueries();
  }, [loadQueries]);

  const selectedQuery = queries.find((q) => q._id === selectedId) ?? null;

  const handleSelect = (query: QueryDoc) => {
    setSelectedId(query._id);
    setView("detail");
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await setQueryActive(id, isActive);
    await loadQueries();
  };

  const handleArchive = async (id: string) => {
    await archiveQuery(id);
    if (selectedId === id) {
      setSelectedId(null);
      setView("empty");
    }
    await loadQueries();
  };

  const handleCreated = async () => {
    const data = await loadQueries();
    // Select the newly created query (first in list, sorted by createdAt desc)
    if (data && data[0]) {
      setSelectedId(data[0]._id);
      setView("detail");
    } else {
      setView("empty");
    }
  };

  return (
    <div className="app">
      <header className="aws-nav">
        <span className="aws-nav-logo">
          <span className="aws-nav-logo-mark">&#9632;</span> JJI Notifier
        </span>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span className="sidebar-title">Search Queries</span>
            <button className="btn-primary" onClick={() => { setSelectedId(null); setView("new"); }}>
              Create query
            </button>
          </div>
          {loading && <p className="muted sidebar-msg">Loading…</p>}
          {error && <p className="error sidebar-msg">{error}</p>}
          {!loading && (
            <QueryList
              queries={queries}
              selectedId={selectedId}
              onSelect={handleSelect}
              onToggleActive={handleToggleActive}
              onArchive={handleArchive}
            />
          )}
        </aside>

        <main className="content">
          {view === "new" && (
            <QueryForm onCreated={handleCreated} onCancel={() => setView(selectedId ? "detail" : "empty")} />
          )}
          {view === "detail" && selectedQuery && (
            <QueryDetail
              query={selectedQuery}
              onToggleActive={handleToggleActive}
              onArchive={handleArchive}
            />
          )}
          {view === "empty" && (
            <div className="empty-state">
              <p>Select a query from the left, or create a new one.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
