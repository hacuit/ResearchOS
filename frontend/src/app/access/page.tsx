"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type LoginResponse = { access_token: string; token_type: string };
type UserProfile = { id: string; email: string; role: string; workspace_id: string };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

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

const sidebarTabs = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/" },
  { icon: <IconAccess />, label: "Access", href: "/access" },
  { icon: <IconProject />, label: "Project Detail", href: "/project" },
];

export default function AccessPage() {
  const pathname = usePathname();
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
    const params = new URLSearchParams({
      reports_dir: "C:/Research/07_reports",
      pattern: "Daily_Report_2026-*.md",
    });
    const res = await fetch(`${API_BASE}/ingest/daily_reports/bulk?${params.toString()}`, { method: "POST", headers });
    setMessage(res.ok ? "Reports ingested" : `Ingest failed: ${res.status}`);
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
