"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { IconSave, IconTrash } from "../components/icons";
import { statusLabel, statusClass, STATUS_VALUES, DELIVERABLE_STATUS_VALUES } from "../lib/status";
import { API_BASE, fetchRetry } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { NotePanel } from "../components/note-panel";

type Idea = { id: string; title: string; status: string; description: string; start_month: string; target_month: string };
type TaskWithIdea = { id: string; idea_id: string; idea_title: string; title: string; status: string; importance: number; start_month: string; end_month: string; due_month: string };
type Deliverable = { id: string; idea_id: string; title: string; type: string; status: string; due_month: string };

type Tab = "ideas" | "tasks" | "deliverables";
type SortConfig = { key: string; direction: "asc" | "desc" } | null;

function cycleSort(current: SortConfig, key: string): SortConfig {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

function sortIndicator(sort: SortConfig, key: string): string {
  if (!sort || sort.key !== key) return "";
  return sort.direction === "asc" ? " \u25B2" : " \u25BC";
}

function sortData<T>(data: T[], sort: SortConfig): T[] {
  if (!sort) return data;
  const { key, direction } = sort;
  return [...data].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const an = typeof av === "number" ? av : Number(av);
    const bn = typeof bv === "number" ? bv : Number(bv);
    if (Number.isFinite(an) && Number.isFinite(bn)) {
      return direction === "asc" ? an - bn : bn - an;
    }
    const cmp = String(av).localeCompare(String(bv), "ko");
    return direction === "asc" ? cmp : -cmp;
  });
}

function SortHeader({ label, sortKey, sort, onSort, style }: {
  label: string;
  sortKey: string;
  sort: SortConfig;
  onSort: (key: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <th className="sortable" style={style} onClick={() => onSort(sortKey)}>
      {label}{sortIndicator(sort, sortKey)}
    </th>
  );
}

export default function ProjectPage() {
  const { token, headers } = useAuth();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("ideas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [allTasks, setAllTasks] = useState<TaskWithIdea[]>([]);
  const [allDeliverables, setAllDeliverables] = useState<Deliverable[]>([]);
  const [filterIdeaId, setFilterIdeaId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  // Sort state per tab
  const [ideaSort, setIdeaSort] = useState<SortConfig>(null);
  const [taskSort, setTaskSort] = useState<SortConfig>(null);
  const [delivSort, setDelivSort] = useState<SortConfig>(null);

  // Note panel expansion
  const [noteId, setNoteId] = useState<string | null>(null);

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

  function startEdit(id: string, init: Record<string, string>) { setEditId(id); setDraft(init); setNoteId(null); }
  function cancelEdit() { setEditId(null); setDraft({}); }

  function toggleNote(ideaId: string) {
    if (editId) return; // don't open notes while editing
    setNoteId((prev) => (prev === ideaId ? null : ideaId));
  }

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

  const sortedIdeas = useMemo(() => sortData(ideas, ideaSort), [ideas, ideaSort]);
  const sortedTasks = useMemo(() => sortData(filteredTasks, taskSort), [filteredTasks, taskSort]);
  const sortedDeliverables = useMemo(() => sortData(filteredDeliverables, delivSort), [filteredDeliverables, delivSort]);

  return (
    <main className="app-shell">
      <Sidebar />

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
            <button key={tab} className={activeTab === tab ? "gantt-tab active" : "gantt-tab"} onClick={() => { setActiveTab(tab); cancelEdit(); setNoteId(null); }}>
              {tab === "ideas" ? `Ideas (${ideas.length})` : tab === "tasks" ? `Tasks (${filteredTasks.length})` : `Deliverables (${filteredDeliverables.length})`}
            </button>
          ))}
        </div>

        {/* Ideas */}
        {activeTab === "ideas" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <SortHeader label="Title" sortKey="title" sort={ideaSort} onSort={(k) => setIdeaSort(cycleSort(ideaSort, k))} style={{ width: "35%" }} />
                    <SortHeader label="Status" sortKey="status" sort={ideaSort} onSort={(k) => setIdeaSort(cycleSort(ideaSort, k))} />
                    <SortHeader label="Start" sortKey="start_month" sort={ideaSort} onSort={(k) => setIdeaSort(cycleSort(ideaSort, k))} />
                    <SortHeader label="Target" sortKey="target_month" sort={ideaSort} onSort={(k) => setIdeaSort(cycleSort(ideaSort, k))} />
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedIdeas.map((idea) => {
                    const ed = editId === idea.id;
                    const showNote = noteId === idea.id && !ed;
                    return (
                      <>
                        <tr key={idea.id} className={ed ? "editing" : showNote ? "expanded-row" : ""} onDoubleClick={() => !ed && startEdit(idea.id, { status: idea.status, title: idea.title, start_month: idea.start_month, target_month: idea.target_month })} onClick={() => !ed && toggleNote(idea.id)}>
                          <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{idea.title}</strong>}</td>
                          <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(idea.status)}>{statusLabel(idea.status)}</span>}</td>
                          <td>{ed ? <input value={draft.start_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_month: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : idea.start_month}</td>
                          <td>{ed ? <input value={draft.target_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, target_month: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : idea.target_month}</td>
                          <td onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
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
                        {showNote && (
                          <tr key={`note-${idea.id}`} className="note-row">
                            <td colSpan={5}><NotePanel ideaId={idea.id} /></td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {ideas.length === 0 && <p className="empty" style={{ padding: 20 }}>No ideas found.</p>}
            </div>
          </section>
        )}

        {/* Tasks */}
        {activeTab === "tasks" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <SortHeader label="Task" sortKey="title" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} style={{ width: "25%" }} />
                    <SortHeader label="Idea" sortKey="idea_title" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} />
                    <SortHeader label="Status" sortKey="status" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} />
                    <SortHeader label="Start" sortKey="start_month" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} />
                    <SortHeader label="End" sortKey="end_month" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} />
                    <SortHeader label="Imp." sortKey="importance" sort={taskSort} onSort={(k) => setTaskSort(cycleSort(taskSort, k))} />
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((t) => {
                    const ed = editId === t.id;
                    const showNote = noteId === t.idea_id && !ed && activeTab === "tasks";
                    return (
                      <>
                        <tr key={t.id} className={ed ? "editing" : ""} onDoubleClick={() => !ed && startEdit(t.id, { status: t.status, title: t.title, start_month: t.start_month, end_month: t.end_month, due_month: t.due_month, importance: String(t.importance) })} onClick={() => !ed && toggleNote(t.idea_id)}>
                          <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{t.title}</strong>}</td>
                          <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{t.idea_title || ideaMap[t.idea_id] || ""}</td>
                          <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(t.status)}>{statusLabel(t.status)}</span>}</td>
                          <td>{ed ? <input value={draft.start_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, start_month: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} style={{ width: 80 }} /> : t.start_month}</td>
                          <td>{ed ? <input value={draft.end_month ?? ""} onChange={(e) => setDraft((d) => ({ ...d, end_month: e.target.value, due_month: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} style={{ width: 80 }} /> : t.end_month}</td>
                          <td>{ed ? <select value={draft.importance ?? "3"} onChange={(e) => setDraft((d) => ({ ...d, importance: e.target.value }))} onClick={(e) => e.stopPropagation()} style={{ width: 50 }}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n}</option>)}</select> : t.importance}</td>
                          <td onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
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
                        {showNote && (
                          <tr key={`note-${t.id}`} className="note-row">
                            <td colSpan={7}><NotePanel ideaId={t.idea_id} /></td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
              {filteredTasks.length === 0 && <p className="empty" style={{ padding: 20 }}>No tasks found.</p>}
            </div>
          </section>
        )}

        {/* Deliverables */}
        {activeTab === "deliverables" && (
          <section className="panel glass" style={{ padding: 0, overflow: "hidden" }}>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <SortHeader label="Deliverable" sortKey="title" sort={delivSort} onSort={(k) => setDelivSort(cycleSort(delivSort, k))} style={{ width: "30%" }} />
                    <SortHeader label="Idea" sortKey="idea_id" sort={delivSort} onSort={(k) => setDelivSort(cycleSort(delivSort, k))} />
                    <SortHeader label="Type" sortKey="type" sort={delivSort} onSort={(k) => setDelivSort(cycleSort(delivSort, k))} />
                    <SortHeader label="Status" sortKey="status" sort={delivSort} onSort={(k) => setDelivSort(cycleSort(delivSort, k))} />
                    <SortHeader label="Due" sortKey="due_month" sort={delivSort} onSort={(k) => setDelivSort(cycleSort(delivSort, k))} />
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeliverables.map((d) => {
                    const ed = editId === d.id;
                    const showNote = noteId === d.idea_id && !ed;
                    return (
                      <>
                        <tr key={d.id} className={ed ? "editing" : ""} onDoubleClick={() => !ed && startEdit(d.id, { status: d.status, title: d.title, due_month: d.due_month })} onClick={() => !ed && toggleNote(d.idea_id)}>
                          <td>{ed ? <input value={draft.title ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, title: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} autoFocus /> : <strong>{d.title}</strong>}</td>
                          <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{ideaMap[d.idea_id] || ""}</td>
                          <td>{d.type}</td>
                          <td>{ed ? <select value={draft.status ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, status: e.target.value }))} onClick={(e) => e.stopPropagation()}>{DELIVERABLE_STATUS_VALUES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select> : <span className={statusClass(d.status)}>{statusLabel(d.status)}</span>}</td>
                          <td>{ed ? <input value={draft.due_month ?? ""} onChange={(e) => setDraft((dr) => ({ ...dr, due_month: e.target.value }))} onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} style={{ width: 90 }} /> : d.due_month}</td>
                          <td onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
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
                        {showNote && (
                          <tr key={`note-${d.id}`} className="note-row">
                            <td colSpan={6}><NotePanel ideaId={d.idea_id} /></td>
                          </tr>
                        )}
                      </>
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
