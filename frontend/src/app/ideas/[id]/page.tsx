"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { API_BASE, fetchRetry } from "@/lib/api";

type Idea = { id: string; title: string; status: string; start_month: string; target_month: string };
type Task = { id: string; title: string; status: string; start_month: string; end_month: string; due_month: string };
type Deliverable = { id: string; title: string; status: string; due_month: string; type: string };

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

export default function IdeaDetailPage() {
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const ideaId = params.id;

  const [token] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("access_token") || "";
  });
  const [idea, setIdea] = useState<Idea | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "Loading...";
    return window.localStorage.getItem("access_token") ? "Loading..." : "Login token missing. Use Access page.";
  });

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    if (!token || !ideaId) return;
    async function loadDetail() {
      const [ideasRes, tasksRes, delRes] = await Promise.all([
        fetchRetry(`${API_BASE}/ideas`, { headers }),
        fetchRetry(`${API_BASE}/ideas/${ideaId}/tasks`, { headers }),
        fetchRetry(`${API_BASE}/ideas/${ideaId}/deliverables`, { headers }),
      ]);
      if (!ideasRes.ok || !tasksRes.ok || !delRes.ok) {
        setMessage("Failed to load detail data.");
        return;
      }
      const allIdeas = (await ideasRes.json()) as Idea[];
      setIdea(allIdeas.find((x) => x.id === ideaId) || null);
      setTasks((await tasksRes.json()) as Task[]);
      setDeliverables((await delRes.json()) as Deliverable[]);
      setMessage("Loaded");
    }
    void loadDetail();
  }, [headers, ideaId, token]);

  const sidebarTabs = [
    { icon: "▣", label: "Dashboard", href: "/" },
    { icon: "⚙", label: "Access", href: "/access" },
    { icon: "◇", label: "Project Detail", href: "/project" },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar glass">
        <h1 className="logo">RO</h1>
        <nav>
          {sidebarTabs.map((tab) => (
            <Link key={tab.label} href={tab.href} className={`side-tab ${pathname === tab.href ? "active" : ""}`}>
              <span>{tab.icon}</span> {tab.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="content">
        <section className="panel glass">
          <h2>{idea?.title || "Idea Detail"}</h2>
          <p className="sub">{message}</p>
          {idea ? <span className={statusClass(idea.status)}>{statusLabel(idea.status)}</span> : null}
        </section>

        <section className="grid-main">
          <article className="panel glass">
            <h2>Sub Tasks</h2>
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>
                  <strong>{task.title}</strong> <span className={statusClass(task.status)}>{statusLabel(task.status)}</span>
                  <p>{task.start_month} ~ {task.end_month}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="panel glass">
            <h2>Deliverables</h2>
            <ul>
              {deliverables.map((d) => (
                <li key={d.id}>
                  <strong>{d.title}</strong> <span className={statusClass(d.status)}>{statusLabel(d.status)}</span>
                  <p>{d.type} · due {d.due_month}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
