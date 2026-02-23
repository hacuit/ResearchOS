"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { useAuth } from "../lib/auth-context";
import { API_BASE } from "../lib/api";

type AIStatus = {
  configured: boolean;
  model: string;
  status: string;
  message: string;
  monthly_budget_usd: number;
};

export default function SettingsPage() {
  const { user, headers, token, logout } = useAuth();
  const [message, setMessage] = useState("");
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    void loadAIStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadAIStatus() {
    setAiLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings/ai`, { headers });
      if (res.ok) setAiStatus((await res.json()) as AIStatus);
    } catch {
      /* ignore */
    }
    setAiLoading(false);
  }

  async function importSeed() {
    if (!token) return;
    const res = await fetch(`${API_BASE}/seed/import?path=../seed/mvp_seed_plan_2026.json`, { method: "POST", headers });
    setMessage(res.ok ? "Seed imported successfully" : `Seed import failed: ${res.status}`);
  }

  async function ingestReports() {
    if (!token) return;
    const ideasRes = await fetch(`${API_BASE}/ideas`, { headers });
    if (!ideasRes.ok) { setMessage("Failed to load ideas"); return; }
    const ideasData = (await ideasRes.json()) as { id: string }[];
    if (ideasData.length === 0) { setMessage("No ideas found — import seed first"); return; }
    const ideaId = ideasData[0].id;
    const res = await fetch(`${API_BASE}/ingest/daily_reports/bulk?idea_id=${ideaId}`, { method: "POST", headers });
    setMessage(res.ok ? "Reports ingested successfully" : `Ingest failed: ${res.status}`);
  }

  const aiIndicatorClass = aiStatus ? `ai-indicator ${aiStatus.status}` : "ai-indicator";

  return (
    <main className="app-shell">
      <Sidebar />

      <div className="content">
        <section className="compact-head glass">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>Settings</h2>
            {message && <p className="sub">{message}</p>}
          </div>
        </section>

        {/* User Profile */}
        <section className="panel glass">
          <h2>User Profile</h2>
          <div className="settings-grid">
            <div className="settings-row">
              <span className="settings-label">Email</span>
              <span className="settings-value">{user?.email || "\u2014"}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Role</span>
              <span className="settings-value">{user?.role || "\u2014"}</span>
            </div>
            <div className="settings-row">
              <span className="settings-label">Workspace ID</span>
              <span className="settings-value" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{user?.workspace_id || "\u2014"}</span>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button onClick={logout} style={{ background: "var(--status-stop-bg)", color: "var(--status-stop-text)", border: "1px solid var(--status-stop-border)" }}>
              Sign out
            </button>
          </div>
        </section>

        {/* AI Configuration */}
        <section className="panel glass">
          <h2>AI Configuration</h2>
          {aiLoading ? (
            <p className="sub">Checking AI status...</p>
          ) : aiStatus ? (
            <div className="settings-grid">
              <div className="settings-row">
                <span className="settings-label">Status</span>
                <span className="settings-value">
                  <span className={aiIndicatorClass} />
                  {aiStatus.status === "active" ? "Active" : aiStatus.status === "inactive" ? "Inactive" : "Error"}
                </span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Model</span>
                <span className="settings-value">{aiStatus.model}</span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Monthly Budget</span>
                <span className="settings-value">${aiStatus.monthly_budget_usd}</span>
              </div>
              <div className="settings-row">
                <span className="settings-label">Message</span>
                <span className="settings-value" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{aiStatus.message}</span>
              </div>
            </div>
          ) : (
            <p className="sub">Failed to load AI status</p>
          )}
          <button onClick={() => void loadAIStatus()} style={{ marginTop: 12, height: 32, fontSize: 12 }} disabled={aiLoading}>
            {aiLoading ? "Checking..." : "Refresh Status"}
          </button>
        </section>

        {/* Developer Tools */}
        <section className="panel glass">
          <h2>Developer Tools</h2>
          <details className="dev-tools-details">
            <summary>Advanced Operations</summary>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p className="sub" style={{ marginBottom: 8 }}>Import seed data (ideas, tasks, deliverables) from the JSON plan file.</p>
                <button onClick={() => void importSeed()} className="btn-purple" style={{ height: 32, fontSize: 12 }}>Import Seed</button>
              </div>
              <div>
                <p className="sub" style={{ marginBottom: 8 }}>Ingest daily markdown reports from the configured reports directory.</p>
                <button onClick={() => void ingestReports()} className="btn-purple" style={{ height: 32, fontSize: 12 }}>Ingest Reports</button>
              </div>
              <p className="meta">Backend: {API_BASE}</p>
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
