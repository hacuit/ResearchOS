"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { useAuth } from "../lib/auth-context";
import { API_BASE, fetchRetry } from "../lib/api";

type Idea = { id: string; title: string };
type UpdateLog = {
  id: string;
  idea_id: string;
  source: string;
  title: string;
  body_md: string;
  ai_summary: string | null;
  ai_tags: string[];
  created_at: string;
};

export default function ReportsPage() {
  const { token, headers } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [filterIdeaId, setFilterIdeaId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  useEffect(() => {
    if (!token) return;
    void loadIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setOffset(0);
    setLogs([]);
    setHasMore(true);
    void loadLogs(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filterIdeaId]);

  async function loadIdeas() {
    try {
      const res = await fetchRetry(`${API_BASE}/ideas`, { headers });
      if (res.ok) setIdeas((await res.json()) as Idea[]);
    } catch { /* ignore */ }
  }

  async function loadLogs(fromOffset: number, replace: boolean) {
    setLoading(true);
    try {
      let url = `${API_BASE}/update_logs?limit=${LIMIT}&offset=${fromOffset}`;
      if (filterIdeaId) url += `&idea_id=${filterIdeaId}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = (await res.json()) as UpdateLog[];
        if (replace) {
          setLogs(data);
        } else {
          setLogs((prev) => [...prev, ...data]);
        }
        setHasMore(data.length >= LIMIT);
        setOffset(fromOffset + data.length);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  function loadMore() {
    void loadLogs(offset, false);
  }

  const ideaMap = Object.fromEntries(ideas.map((i) => [i.id, i.title]));

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
  }

  return (
    <main className="app-shell">
      <Sidebar />

      <div className="content">
        <section className="compact-head glass">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Reports</h2>
            <p className="sub">{logs.length} report{logs.length !== 1 ? "s" : ""} loaded</p>
          </div>
          <div className="report-filters">
            <select value={filterIdeaId} onChange={(e) => setFilterIdeaId(e.target.value)} style={{ width: 240 }}>
              <option value="">All Ideas</option>
              {ideas.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </div>
        </section>

        <div className="report-list">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <article
                key={log.id}
                className={`report-card panel glass ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
              >
                <div className="report-card-header">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 className="report-title">{log.title}</h3>
                    <div className="report-meta">
                      <span>{formatDate(log.created_at)}</span>
                      {log.idea_id && <span>{ideaMap[log.idea_id] || "Unknown Idea"}</span>}
                      <span className="report-source">{log.source}</span>
                    </div>
                  </div>
                  {log.ai_summary && !isExpanded && (
                    <p className="report-summary">{log.ai_summary}</p>
                  )}
                </div>

                {log.ai_tags.length > 0 && (
                  <div className="report-tags">
                    {log.ai_tags.map((tag) => (
                      <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                  </div>
                )}

                {isExpanded && (
                  <div className="report-body" onClick={(e) => e.stopPropagation()}>
                    {log.ai_summary && (
                      <div className="report-ai-summary">
                        <strong>AI Summary</strong>
                        <p>{log.ai_summary}</p>
                      </div>
                    )}
                    <div className="report-md">
                      <strong>Full Report</strong>
                      <pre>{log.body_md}</pre>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {logs.length === 0 && !loading && (
            <p className="empty" style={{ padding: 20, textAlign: "center" }}>No reports found.</p>
          )}

          {hasMore && logs.length > 0 && (
            <button onClick={loadMore} disabled={loading} className="load-more">
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
