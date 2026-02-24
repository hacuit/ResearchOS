"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_BASE, fetchRetry } from "@/lib/api";

type Idea = { id: string; title: string; status: string; description: string; start_month: string; target_month: string };
type TaskWithIdea = { id: string; idea_id: string; idea_title: string; title: string; status: string; importance: number; start_month: string; end_month: string; due_month: string };
type Deliverable = { id: string; idea_id: string; title: string; type: string; status: string; due_month: string };
const STATUS_OPTIONS = ["planned", "in_progress", "completed", "on_hold", "stopped", "discarded"] as const;
const DELIVERABLE_STATUS_OPTIONS = ["planned", "in_progress", "completed"] as const;

function statusLabel(s: string): string {
  const map: Record<string, string> = { planned: "예정", in_progress: "진행중", completed: "완료", on_hold: "보류", stopped: "중단", discarded: "폐기" };
  return map[s] || s;
}
function statusClass(s: string): string {
  const map: Record<string, string> = { completed: "chip done", in_progress: "chip prog", planned: "chip plan", on_hold: "chip hold", stopped: "chip stop", discarded: "chip disc" };
  return map[s] || "chip";
}

function IconDashboard() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>); }
function IconAccess() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>); }
function IconProject() { return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>); }
function IconSave() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>); }
function IconTrash() { return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>); }

const sidebarTabs = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/" },
  { icon: <IconAccess />, label: "Access", href: "/access" },
  { icon: <IconProject />, label: "Project Detail", href: "/project" },
];

type Tab = "ideas" | "tasks" | "deliverables";

export default function ProjectPage() {
  const pathname = usePathname();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithIdea[]>([]);
  const [allDeliverables, setAllDeliverables] = useState<Deliverable[]>([]);
  const [filterIdeaId, setFilterIdeaId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("theme");
    const savedToken = window.localStorage.getItem("access_token");
    if (savedTheme === "dark" || savedTheme === "light") document.documentElement.setAttribute("data-theme", savedTheme);
    if (savedToken) setToken(savedToken);
  }, []);

  async function loadIdeas() {
    if (!token) return;
    const res = await fetchRetry(`${API_BASE}/ideas`, { headers });
    if (res.ok) setIdeas((await res.json()) as Idea[]);
  }
  async function loadAllTasks() {
    if (!token) return;
    const res = await fetchRetry(`${API_BASE}/tasks`, { headers });
    if (res.ok) setAllTasks((await res.json()) as TaskWithIdea[]);
  }
  async function loadAllDeliverables(ideaList?: Idea[]) {
    if (!token) return;
    const list = ideaList || ideas;
    const all: Deliverable[] = [];
    for (const idea of list) {
      const res = await fetchRetry(`${API_BASE}/ideas/${idea.id}/deliverables`, { headers });
      if (res.ok) all.push(...((await res.json()) as Deliverable[]));
    }
    setAllDeliverables(all);
  }

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetchRetry(`${API_BASE}/ideas`, { headers });
      if (!res.ok) return;
      const data = (await res.json()) as Idea[];
      setIdeas(data);
      await Promise.all([loadAllTasks(), loadAllDeliverables(data)]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function startEdit(id: string, init: Record<string, string>) { setEditId(id); setDraft(init); }
  function cancelEdit() { setEditId(null); setDraft({}); }

  async function patchAndReload(url: string, payload: Record<string, unknown>, reload: () => Promise<void>) {
    const res = await fetchRetry(url, { method: "PATCH", headers, body: JSON.stringify(payload) });
    if (!res.ok) { setMessage(`Save failed: ${res.status}`); return; }
    setMessage("Saved"); cancelEdit(); await reload();
  }
  async function deleteAndReload(url: string, name: string, reload: () => Promise<void>) {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetchRetry(url, { method: "DELETE", headers });
    if (!res.ok) { setMessage(`Delete failed: ${res.status}`); return; }
    setMessage("Deleted"); await reload();
  }

  const filteredTasks = filterIdeaId ? allTasks.filter((t) => t.idea_id === filterIdeaId) : allTasks;
  const filteredDeliverables = filterIdeaId ? allDeliverables.filter((d) => d.idea_id === filterIdeaId) : allDeliverables;
  const ideaMap = Object.fromEntries(ideas.map((i) => [i.id, i.title]));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h1 className="logo">RO</h1>
        <nav>
          {sidebarTabs.map((tab) => (
            <Link key={tab.label} href={tab.href} className={`side-tab ${pathname === tab.href ? "active" : ""}`}>
              {tab.icon} {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="content">
        <section className="compact-head glass">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Project Management</h2>
            {message && <p className="sub">{message}</p>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={filterIdeaId} onChange={(e) => setFilterIdeaId(e.target.value)} style={{ width: 220 }}>
              <option value="">All Ideas</option>
              {ideas.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
            <button onClick={() => { void loadIdeas(); void loadAllTasks(); void loadAllDeliverables(); }} disabled={!token}>Reload</button>
          </div>
        </section>

        <div className="gantt-toggle" style={{ alignSelf: "flex-start" }}>
          {(["ideas", "tasks", "deliverables"] as Tab[]).map((tab) => (
            <button key={tab} className={activeTab === tab ? "gantt-tab active" : "gantt-tab"} onClick={() => { setActiveTab(tab); cancelEdit(); }}>
              {tab === "ideas" ? `Ideas (${ideas.length})` : tab === "tasks" ? `Tasks (${filteredTasks.length})` : `Deliverables (${filteredDeliverables.length})`}
            </button>
          ))}
        </div>

        {/* ── Ideas ── */}
        {activeTab === "ideas" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead><tr><th style={{ width: "35%" }}>Title</th><th>Status</th><th>Start</th><th>Target</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                <tbody>
                  {ideas.map((idea) => {
                    const ed = editId === idea.id;
                    return (
                      <tr key={idea.id} className={ed ? "editing" : ""} onClick={() => !ed && startEdit(idea.id, { status: idea.status, title: idea.title, start_month: idea.start_month, target_month: idea.target_month })}>
                        <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} onClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{idea.title}</strong>}</td>
                        <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(idea.status)}>{statusLabel(idea.status)}</span>}</td>
                        <td>{ed ? <input value={draft.start_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_month: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : idea.start_month}</td>
                        <td>{ed ? <input value={draft.target_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, target_month: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : idea.target_month}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {ed ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => void patchAndReload(`${API_BASE}/ideas/${idea.id}`, draft, loadIdeas)} style={{ height: 28, padding: "0 8px" }}><IconSave /></button>
                              <button onClick={cancelEdit} style={{ height: 28, padding: "0 8px", background: "var(--bg-sunken)", color: "var(--text-secondary)" }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => void deleteAndReload(`${API_BASE}/ideas/${idea.id}`, idea.title, async () => { await loadIdeas(); await loadAllTasks(); })} className="btn-del"><IconTrash /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {ideas.length === 0 && <p className="empty" style={{ padding: 20 }}>No ideas found.</p>}
            </div>
          </section>
        )}

        {/* ── Tasks ── */}
        {activeTab === "tasks" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead><tr><th style={{ width: "25%" }}>Task</th><th>Idea</th><th>Status</th><th>Start</th><th>End</th><th>Imp.</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const ed = editId === t.id;
                    return (
                      <tr key={t.id} className={ed ? "editing" : ""} onClick={() => !ed && startEdit(t.id, { status: t.status, title: t.title, start_month: t.start_month, end_month: t.end_month, due_month: t.due_month, importance: String(t.importance) })}>
                        <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} onClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{t.title}</strong>}</td>
                        <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t.idea_title || ideaMap[t.idea_id] || ""}</td>
                        <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(t.status)}>{statusLabel(t.status)}</span>}</td>
                        <td>{ed ? <input value={draft.start_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_month: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 80 }} /> : t.start_month}</td>
                        <td>{ed ? <input value={draft.end_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, end_month: e.target.value, due_month: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 80 }} /> : t.end_month}</td>
                        <td>{ed ? <select value={draft.importance ?? "3"} onChange={(e) => setDraft((d) => ({ ...d, importance: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 50 }}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select> : t.importance}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {ed ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => { const p: Record<string, unknown> = { ...draft }; if (draft.importance) p.importance = Number(draft.importance); void patchAndReload(`${API_BASE}/tasks/${t.id}`, p, loadAllTasks); }} style={{ height: 28, padding: "0 8px" }}><IconSave /></button>
                              <button onClick={cancelEdit} style={{ height: 28, padding: "0 8px", background: "var(--bg-sunken)", color: "var(--text-secondary)" }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => void deleteAndReload(`${API_BASE}/tasks/${t.id}`, t.title, loadAllTasks)} className="btn-del"><IconTrash /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredTasks.length === 0 && <p className="empty" style={{ padding: 20 }}>No tasks found.</p>}
            </div>
          </section>
        )}

        {/* ── Deliverables ── */}
        {activeTab === "deliverables" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead><tr><th style={{ width: "30%" }}>Deliverable</th><th>Idea</th><th>Type</th><th>Status</th><th>Due</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                <tbody>
                  {filteredDeliverables.map((d) => {
                    const ed = editId === d.id;
                    return (
                      <tr key={d.id} className={ed ? "editing" : ""} onClick={() => !ed && startEdit(d.id, { status: d.status, title: d.title, due_month: d.due_month })}>
                        <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, title: e.target.value }))} onClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{d.title}</strong>}</td>
                        <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{ideaMap[d.idea_id] || ""}</td>
                        <td>{d.type}</td>
                        <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{DELIVERABLE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(d.status)}>{statusLabel(d.status)}</span>}</td>
                        <td>{ed ? <input value={draft.due_month ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, due_month: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : d.due_month}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {ed ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => void patchAndReload(`${API_BASE}/deliverables/${d.id}`, draft, () => loadAllDeliverables())} style={{ height: 28, padding: "0 8px" }}><IconSave /></button>
                              <button onClick={cancelEdit} style={{ height: 28, padding: "0 8px", background: "var(--bg-sunken)", color: "var(--text-secondary)" }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => void deleteAndReload(`${API_BASE}/deliverables/${d.id}`, d.title, () => loadAllDeliverables())} className="btn-del"><IconTrash /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredDeliverables.length === 0 && <p className="empty" style={{ padding: 20 }}>No deliverables found.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
