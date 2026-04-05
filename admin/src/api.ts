import type { QueryDoc, SearchQuery, Offer } from "./types.js";

export async function getQueries(): Promise<QueryDoc[]> {
  const res = await fetch("/api/queries");
  if (!res.ok) throw new Error("Failed to fetch queries");
  return res.json();
}

export async function createQuery(label: string, config: SearchQuery): Promise<QueryDoc> {
  const res = await fetch("/api/queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label, config }),
  });
  if (!res.ok) throw new Error("Failed to create query");
  return res.json();
}

export async function setQueryActive(id: string, isActive: boolean): Promise<QueryDoc> {
  const res = await fetch(`/api/queries/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) throw new Error("Failed to update query");
  return res.json();
}

export async function archiveQuery(id: string): Promise<QueryDoc> {
  const res = await fetch(`/api/queries/${id}/archive`, { method: "PATCH" });
  if (!res.ok) throw new Error("Failed to archive query");
  return res.json();
}

export async function renameQuery(id: string, label: string): Promise<QueryDoc> {
  const res = await fetch(`/api/queries/${id}/label`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error("Failed to rename query");
  return res.json();
}

export async function previewQuery(config: SearchQuery): Promise<{ offers: Offer[]; total: number }> {
  const res = await fetch("/api/queries/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) throw new Error("Failed to preview query");
  return res.json();
}
