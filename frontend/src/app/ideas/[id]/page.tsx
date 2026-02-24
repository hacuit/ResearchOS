"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "../../components/sidebar";
import { statusLabel, statusClass } from "../../lib/status";
import { API_BASE, fetchRetry } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";

type Idea = { id: string; title: string; status: string; start_month: string; target_month: string };
type Task = { id: string; title: string; status: string; start_month: string; end_month: string; due_month: string };
type Deliverable = { id: string; title: string; status: string; due_month: string; type: string };

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const ideaId = params.id;

  const { token, headers } = useAuth();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [message, setMessage] = useState("Loading...");

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

  return (
    <main className="app-shell">
      <Sidebar />

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
