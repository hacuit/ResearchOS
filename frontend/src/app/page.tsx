"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Idea = { id: string; title: string; status: string; start_month: string; target_month: string };
type Task = {
  id: string;
  title: string;
  status: string;
  start_month: string;
  end_month: string;
  due_month: string;
  importance: number;
};
type TaskWithIdea = Task & { idea_id: string; idea_title: string };
type UpdateLog = { id: string; title: string; source: string; created_at: string; ai_summary: string | null; ai_tags: string[] };
type Dashboard = {
  total_ideas: number;
  idea_status_counts: Record<string, number>;
  delayed_tasks: number;
  low_activity_tasks: number;
};
type IdeaProgress = {
  idea_id: string;
  task_completion: number;
  deliverable_completion: number;
  idea_progress: number;
};
type RiskItem = { code: string; severity: string; message: string; related_entity: string | null; related_id: string | null };
type NextActions = { idea_id: string; actions: string[] };
type DragMode = "move" | "resize_start" | "resize_end";
type DragState = {
  taskId: string;
  mode: DragMode;
  startX: number;
  initialStart: number;
  initialEnd: number;
  pxPerMonth: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const VIEW_YEAR = 2026;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/* ── SVG Icon components ── */
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconAccess() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconProject() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function IconThemeLight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconThemeDark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function monthToIndex(monthStr: string): number {
  const [, mm] = monthStr.split("-");
  const m = Number(mm);
  if (!Number.isFinite(m)) return 1;
  return Math.max(1, Math.min(12, m));
}

function indexToMonth(monthIndex: number): string {
  const mm = String(Math.max(1, Math.min(12, monthIndex))).padStart(2, "0");
  return `${VIEW_YEAR}-${mm}`;
}

function statusClass(status: string): string {
  switch (status) {
    case "completed":
      return "chip done";
    case "in_progress":
      return "chip prog";
    case "planned":
      return "chip plan";
    case "on_hold":
      return "chip hold";
    case "stopped":
      return "chip stop";
    case "discarded":
      return "chip disc";
    default:
      return "chip";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "planned":
      return "예정";
    case "in_progress":
      return "진행중";
    case "completed":
      return "완료";
    case "on_hold":
      return "보류";
    case "stopped":
      return "중단";
    case "discarded":
      return "폐기";
    default:
      return status;
  }
}

function CircleMetric({ label, value, color }: { label: string; value: number; color: string }) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const radius = 42;
  const stroke = 8;
  const c = 2 * Math.PI * radius;
  const offset = c * (1 - normalized);
  const pct = Math.round(normalized * 100);
  return (
    <div className="circle-card">
      <svg width="110" height="110" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div className="circle-value">{pct}%</div>
      <div className="circle-label">{label}</div>
    </div>
  );
}

const sidebarTabs = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/" },
  { icon: <IconAccess />, label: "Access", href: "/access" },
  { icon: <IconProject />, label: "Project Detail", href: "/project" },
];

export default function Home() {
  const pathname = usePathname();
  const [month, setMonth] = useState("2026-02");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [progress, setProgress] = useState<IdeaProgress | null>(null);
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [taskRangeEdits, setTaskRangeEdits] = useState<Record<string, { start: number; end: number; dirty: boolean }>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const taskRangeEditsRef = useRef<Record<string, { start: number; end: number; dirty: boolean }>>({});
  const [ganttMode, setGanttMode] = useState<"selected" | "all">("selected");
  const [allTasks, setAllTasks] = useState<TaskWithIdea[]>([]);

  const [message, setMessage] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [autoSyncReports, setAutoSyncReports] = useState(true);
  const autoBootRef = useRef(false);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("theme");
    const savedToken = window.localStorage.getItem("access_token");
    const savedSync = window.localStorage.getItem("auto_sync_reports");
    if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    if (savedToken) setToken(savedToken);
    if (savedSync === "true" || savedSync === "false") setAutoSyncReports(savedSync === "true");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (typeof window !== "undefined") window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (token) window.localStorage.setItem("access_token", token);
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("auto_sync_reports", String(autoSyncReports));
  }, [autoSyncReports]);

  async function loginFromLocal(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const email = window.localStorage.getItem("owner_email") || "dhkwon@dgist.ac.kr";
    const password = window.localStorage.getItem("owner_password") || "asdf";
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token: string };
      setToken(data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  }

  function headersWith(t: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
  }

  async function loadDashboard(tokenOverride?: string) {
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const res = await fetch(`${API_BASE}/dashboard/overview?month=${month}`, { headers: authHeaders });
    if (!res.ok) return;
    setDashboard((await res.json()) as Dashboard);
  }

  async function loadIdeas(tokenOverride?: string): Promise<Idea[]> {
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const res = await fetch(`${API_BASE}/ideas`, { headers: authHeaders });
    if (!res.ok) return [];
    const data = (await res.json()) as Idea[];
    setIdeas(data);
    if (data.length > 0 && !selectedIdeaId) setSelectedIdeaId(data[0].id);
    return data;
  }

  async function loadTasks(ideaId?: string, tokenOverride?: string) {
    const id = ideaId || selectedIdeaId;
    if (!id) return;
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const res = await fetch(`${API_BASE}/ideas/${id}/tasks`, { headers: authHeaders });
    if (!res.ok) return;
    const data = (await res.json()) as Task[];
    setTasks(data);
    const nextEdits = data.reduce<Record<string, { start: number; end: number; dirty: boolean }>>((acc, task) => {
      acc[task.id] = {
        start: monthToIndex(task.start_month),
        end: monthToIndex(task.end_month),
        dirty: false,
      };
      return acc;
    }, {});
    taskRangeEditsRef.current = nextEdits;
    setTaskRangeEdits(nextEdits);
  }

  async function loadLogs(ideaId?: string, tokenOverride?: string) {
    const id = ideaId || selectedIdeaId;
    if (!id) return;
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const res = await fetch(`${API_BASE}/ideas/${id}/update_logs?limit=8`, { headers: authHeaders });
    if (!res.ok) return;
    setLogs((await res.json()) as UpdateLog[]);
  }

  async function loadAllTasks(tokenOverride?: string) {
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const res = await fetch(`${API_BASE}/tasks`, { headers: authHeaders });
    if (!res.ok) return;
    const data = (await res.json()) as TaskWithIdea[];
    setAllTasks(data);
    const nextEdits: Record<string, { start: number; end: number; dirty: boolean }> = {};
    for (const task of data) {
      if (!taskRangeEditsRef.current[task.id]) {
        nextEdits[task.id] = { start: monthToIndex(task.start_month), end: monthToIndex(task.end_month), dirty: false };
      }
    }
    if (Object.keys(nextEdits).length > 0) {
      taskRangeEditsRef.current = { ...taskRangeEditsRef.current, ...nextEdits };
      setTaskRangeEdits((prev) => ({ ...prev, ...nextEdits }));
    }
  }

  async function ingestReports(ideaId?: string, tokenOverride?: string) {
    const id = ideaId || selectedIdeaId;
    if (!id) return;
    const authHeaders = tokenOverride ? headersWith(tokenOverride) : headers;
    const params = new URLSearchParams({
      idea_id: id,
      reports_dir: "C:/Research/07_reports",
      pattern: "Daily_Report_2026-*.md",
    });
    const res = await fetch(`${API_BASE}/ingest/daily_reports/bulk?${params.toString()}`, { method: "POST", headers: authHeaders });
    if (!res.ok) throw new Error(`ingest failed: ${res.status}`);
  }

  async function loadIntelligence(ideaId?: string) {
    const id = ideaId || selectedIdeaId;
    if (!id || !token) return;
    const [pRes, rRes, aRes] = await Promise.all([
      fetch(`${API_BASE}/ideas/${id}/progress`, { headers }),
      fetch(`${API_BASE}/ideas/${id}/risks?month=${month}`, { headers }),
      fetch(`${API_BASE}/ideas/${id}/next_actions?month=${month}`, { headers }),
    ]);
    if (pRes.ok) setProgress((await pRes.json()) as IdeaProgress);
    if (rRes.ok) setRisks((await rRes.json()) as RiskItem[]);
    if (aRes.ok) {
      const payload = (await aRes.json()) as NextActions;
      setNextActions(payload.actions);
    }
  }

  async function initialLoad(t: string) {
    const loadedIdeas = await loadIdeas(t);
    const ideaId = loadedIdeas[0]?.id || "";
    if (ideaId) {
      setSelectedIdeaId(ideaId);
      await loadTasks(ideaId, t);
      await loadLogs(ideaId, t);
    }
    await Promise.all([loadDashboard(t), loadAllTasks(t)]);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (autoBootRef.current) return;
    autoBootRef.current = true;
    async function autoBoot() {
      try {
        const health = await fetch(`${API_BASE}/health`);
        if (!health.ok) {
          setMessage("Backend is not ready.");
          return;
        }
        const t = token || (await loginFromLocal());
        if (!t) {
          setMessage("Login required. Go to Access page.");
          return;
        }
        await initialLoad(t);
        setMessage("Dashboard loaded");
      } catch {
        setMessage("Connection failed. Check backend.");
      }
    }
    void autoBoot();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    taskRangeEditsRef.current = taskRangeEdits;
  }, [taskRangeEdits]);

  useEffect(() => {
    if (!autoSyncReports || !token || !selectedIdeaId) return;
    const timer = window.setInterval(async () => {
      try {
        await ingestReports(selectedIdeaId);
        await loadLogs(selectedIdeaId);
      } catch {
        setMessage("Auto-sync skipped: backend/report path unavailable");
      }
    }, 60000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSyncReports, token, selectedIdeaId]);

  async function refreshCore() {
    if (!token || !selectedIdeaId) return;
    setBusy(true);
    try {
      await Promise.all([
        loadTasks(selectedIdeaId),
        loadAllTasks(),
        loadDashboard(),
        loadIntelligence(selectedIdeaId),
        loadLogs(selectedIdeaId),
      ]);
      setMessage("Data refreshed");
    } finally {
      setBusy(false);
    }
  }

  function taskRange(task: Task) {
    return taskRangeEdits[task.id] || { start: monthToIndex(task.start_month), end: monthToIndex(task.end_month), dirty: false };
  }

  function beginDrag(e: ReactMouseEvent<HTMLDivElement>, task: Task, mode: DragMode) {
    e.preventDefault();
    const range = taskRange(task);
    const timelineEl = (e.currentTarget.closest(".timeline") as HTMLElement) || e.currentTarget;
    const width = timelineEl.getBoundingClientRect().width;
    if (width <= 0) return;
    setDragState({
      taskId: task.id,
      mode,
      startX: e.clientX,
      initialStart: range.start,
      initialEnd: range.end,
      pxPerMonth: width / 12,
    });
  }

  useEffect(() => {
    if (!dragState) return;
    const ds = dragState;

    function onMouseMove(event: MouseEvent) {
      const deltaPx = event.clientX - ds.startX;
      const deltaMonth = Math.round(deltaPx / ds.pxPerMonth);

      setTaskRangeEdits((prev) => {
        const next = { ...prev };
        const current = next[ds.taskId] || { start: ds.initialStart, end: ds.initialEnd, dirty: false };
        let start = ds.initialStart;
        let end = ds.initialEnd;

        if (ds.mode === "move") {
          start = ds.initialStart + deltaMonth;
          end = ds.initialEnd + deltaMonth;
          if (start < 1) {
            end += 1 - start;
            start = 1;
          }
          if (end > 12) {
            start -= end - 12;
            end = 12;
          }
        } else if (ds.mode === "resize_start") {
          start = Math.min(ds.initialEnd, Math.max(1, ds.initialStart + deltaMonth));
          end = ds.initialEnd;
        } else {
          start = ds.initialStart;
          end = Math.max(ds.initialStart, Math.min(12, ds.initialEnd + deltaMonth));
        }

        next[ds.taskId] = { ...current, start, end, dirty: true };
        taskRangeEditsRef.current = next;
        return next;
      });
    }

    function onMouseUp() {
      const latest = taskRangeEditsRef.current[ds.taskId];
      setDragState(null);
      if (latest?.dirty) void saveTaskRange(ds.taskId);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState]);

  async function saveTaskRange(taskId: string) {
    const range = taskRangeEditsRef.current[taskId];
    const task = tasks.find((t) => t.id === taskId);
    if (!range || !task || !token) return;

    const payload = {
      status: task.status,
      start_month: indexToMonth(range.start),
      end_month: indexToMonth(range.end),
      due_month: indexToMonth(range.end),
    };

    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setMessage(`Task range save failed: ${res.status}`);
      return;
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, start_month: payload.start_month, end_month: payload.end_month, due_month: payload.due_month } : t,
      ),
    );
    setTaskRangeEdits((prev) => ({ ...prev, [taskId]: { ...prev[taskId], dirty: false } }));
    taskRangeEditsRef.current = { ...taskRangeEditsRef.current, [taskId]: { ...taskRangeEditsRef.current[taskId], dirty: false } };
  }

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
        {/* ── Header ── */}
        <section className="compact-head glass">
          <div>
            <h2>Research OS</h2>
            <p className="sub">Idea Dashboard · {VIEW_YEAR}</p>
          </div>
          <div className="head-tools">
            <button
              className="icon-btn"
              onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <IconThemeDark /> : <IconThemeLight />}
            </button>
            <label className="toggle-pill" title="Auto-sync reports">
              <input type="checkbox" checked={autoSyncReports} onChange={(e) => setAutoSyncReports(e.target.checked)} />
              <span>Auto-sync</span>
            </label>
            <button className="icon-btn" onClick={refreshCore} disabled={busy || !selectedIdeaId || !token} title="Refresh" aria-label="Refresh">
              <IconRefresh />
            </button>
          </div>
        </section>

        {/* ── Overview + Progress ── */}
        <section className="overview-progress-row">
          <article className="panel glass">
            <h2>Overview</h2>
            <div className="grid2">
              <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="YYYY-MM" />
              <button onClick={() => void loadDashboard()} disabled={!token}>Load Overview</button>
            </div>
            <div className="cards">
              <div className="metric"><span>Total Ideas</span><strong>{dashboard?.total_ideas ?? 0}</strong></div>
              <div className="metric"><span>Delayed Tasks</span><strong>{dashboard?.delayed_tasks ?? 0}</strong></div>
              <div className="metric"><span>Low Activity</span><strong>{dashboard?.low_activity_tasks ?? 0}</strong></div>
            </div>
            <div className="status-list">
              {Object.entries(dashboard?.idea_status_counts || {}).map(([key, value]) => (
                <span key={key} className={statusClass(key)}>{statusLabel(key)} {value}</span>
              ))}
            </div>
          </article>

          <article className="panel glass">
            <h2>Progress</h2>
            <div className="actions">
              <button onClick={() => void loadIntelligence()} disabled={!token || !selectedIdeaId}>Load Progress</button>
            </div>
            <div className="circle-grid">
              <CircleMetric label="Idea Progress" value={progress?.idea_progress ?? 0} color="var(--accent)" />
              <CircleMetric label="Task Completion" value={progress?.task_completion ?? 0} color="var(--purple)" />
              <CircleMetric label="Deliverable" value={progress?.deliverable_completion ?? 0} color="var(--cyan)" />
            </div>
            <p className="status">{message}</p>
          </article>
        </section>

        {/* ── Gantt ── */}
        <section className="panel glass">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ marginBottom: 0 }}>Gantt (Tasks)</h2>
            <div className="gantt-toggle">
              <button
                className={ganttMode === "selected" ? "gantt-tab active" : "gantt-tab"}
                onClick={() => setGanttMode("selected")}
              >
                Selected Idea
              </button>
              <button
                className={ganttMode === "all" ? "gantt-tab active" : "gantt-tab"}
                onClick={() => setGanttMode("all")}
              >
                All Ideas
              </button>
            </div>
          </div>
          <div className="legend">
            <span className="dot task-dot" /> Task Bar (v1.0)
          </div>
          <div className="gantt-wrap">
            <div className="gantt-head">
              <div className="label">{ganttMode === "all" ? "Idea / Task" : "Item"}</div>
              <div className="timeline">
                {MONTHS.map((m) => <div key={`h-${m}`} className="month-col">{m}</div>)}
              </div>
            </div>
            {(ganttMode === "all" ? allTasks : tasks).map((task) => {
              const range = taskRange(task);
              const s = range.start;
              const e = range.end;
              const left = ((s - 1) / 12) * 100;
              const width = (Math.max(1, e - s + 1) / 12) * 100;
              const ideaTitle = ganttMode === "all" && "idea_title" in task ? (task as TaskWithIdea).idea_title : "";
              return (
                <div className="gantt-row" key={task.id}>
                  <div className="label">
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      {ideaTitle && <span style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ideaTitle}</span>}
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</span>
                    </span>
                    <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
                  </div>
                  <div className="timeline">
                    {MONTHS.map((m) => <div key={`${task.id}-${m}`} className="month-col guide" />)}
                    <div
                      className={`bar task draggable ${task.status === "planned" ? "planned" : ""}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onMouseDown={(e) => beginDrag(e, task, "move")}
                    >
                      <div className="handle left" onMouseDown={(e) => beginDrag(e, task, "resize_start")} />
                      <div className="handle right" onMouseDown={(e) => beginDrag(e, task, "resize_end")} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Idea Workspace ── */}
        <section className="panel glass">
          <h2>Idea Workspace</h2>
          <div className="grid2">
            <select value={selectedIdeaId} onChange={(e) => setSelectedIdeaId(e.target.value)}>
              <option value="">Select idea</option>
              {ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}
            </select>
            <button className="btn-purple" onClick={() => void refreshCore()} disabled={!token || !selectedIdeaId}>Load Selected Idea</button>
          </div>
          <ul className="idea-links">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <Link href={`/ideas/${idea.id}`} className="idea-link">
                  <strong>{idea.title}</strong>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={statusClass(idea.status)}>{statusLabel(idea.status)}</span>
                    <IconChevronRight />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {ideas.length === 0 ? <p className="empty">No ideas loaded yet.</p> : null}
        </section>

        {/* ── Logs + Risks ── */}
        <section className="grid-main">
          <article className="panel glass">
            <h2>Recent Update Logs</h2>
            <ul>
              {logs.map((log) => (
                <li key={log.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <strong>{log.title}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{log.created_at.slice(0, 10)}</span>
                  </div>
                  <p style={{ marginTop: 4 }}>{log.ai_summary || "No summary"}</p>
                  {log.ai_tags && log.ai_tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      {log.ai_tags.map((tag) => (
                        <span key={tag} style={{ fontSize: 11, padding: "1px 6px", borderRadius: "var(--radius-full)", background: "var(--accent-muted)", color: "var(--accent)", fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </article>

          <article className="panel glass">
            <h2>Risk & Next Actions</h2>
            <h3>Risks</h3>
            <ul>
              {risks.map((r, idx) => (
                <li key={`${r.code}-${idx}`}>
                  <strong>[{r.severity}] {r.code}</strong> — {r.message}
                </li>
              ))}
            </ul>
            {risks.length === 0 ? <p className="empty">No risk flags.</p> : null}
            <h3>Next Actions</h3>
            <ol>
              {nextActions.map((a, idx) => (
                <li key={`next-${idx}`}>{a}</li>
              ))}
            </ol>
          </article>
        </section>
      </div>
    </main>
  );
}
