"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "../components/sidebar";
import { API_BASE } from "../lib/api";

type LoginResponse = { access_token: string; token_type: string };
type UserProfile = { id: string; email: string; role: string; workspace_id: string };

export default function AccessPage() {
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "dhkwon@dgist.ac.kr";
    return window.localStorage.getItem("owner_email") || "dhkwon@dgist.ac.kr";
  });
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") return "asdf";
    return window.localStorage.getItem("owner_password") || "asdf";
  });
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("access_token") || "";
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("Access page");

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  async function login() {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setMessage(`Login failed: ${res.status}`);
      return;
    }
    const data = (await res.json()) as LoginResponse;
    setToken(data.access_token);
    window.localStorage.setItem("access_token", data.access_token);
    window.localStorage.setItem("owner_email", email);
    window.localStorage.setItem("owner_password", password);
    setMessage("Login success");
  }

  async function loadProfile() {
    if (!token) return;
    const res = await fetch(`${API_BASE}/me`, { headers });
    if (!res.ok) {
      setMessage(`Profile load failed: ${res.status}`);
      return;
    }
    setProfile((await res.json()) as UserProfile);
    setMessage("Profile loaded");
  }

  async function importSeed() {
    if (!token) return;
    const res = await fetch(`${API_BASE}/seed/import?path=../seed/mvp_seed_plan_2026.json`, { method: "POST", headers });
    setMessage(res.ok ? "Seed imported" : `Seed import failed: ${res.status}`);
  }

  async function ingestReports() {
    if (!token) return;
    // First get ideas to find an idea_id for bulk ingest
    const ideasRes = await fetch(`${API_BASE}/ideas`, { headers });
    if (!ideasRes.ok) { setMessage("Failed to load ideas"); return; }
    const ideasData = (await ideasRes.json()) as { id: string }[];
    if (ideasData.length === 0) { setMessage("No ideas found — import seed first"); return; }
    const ideaId = ideasData[0].id;
    const res = await fetch(`${API_BASE}/ingest/daily_reports/bulk?idea_id=${ideaId}`, { method: "POST", headers });
    setMessage(res.ok ? "Reports ingested" : `Ingest failed: ${res.status}`);
  }

  return (
    <main className="app-shell">
      <Sidebar />
      <div className="content">
        <section className="panel glass">
          <h2>Developer Access</h2>
          <p className="sub">{message}</p>
          <div className="grid2" style={{ marginTop: 16 }}>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
          </div>
          <div className="actions">
            <button onClick={login}>Login</button>
            <button className="btn-purple" onClick={loadProfile} disabled={!token}>Load Profile</button>
            <button className="btn-purple" onClick={importSeed} disabled={!token}>Import Seed</button>
            <button className="btn-purple" onClick={ingestReports} disabled={!token}>Ingest Reports</button>
          </div>
          <p className="meta">Backend: {API_BASE}</p>
          {profile ? <pre>{JSON.stringify(profile, null, 2)}</pre> : null}
        </section>
      </div>
    </main>
  );
}
