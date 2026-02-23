"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth-context";

export function LoginModal() {
  const { login } = useAuth();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("owner_email") || "dhkwon@dgist.ac.kr";
  });
  const [password, setPassword] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("owner_password") || "asdf";
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setBusy(true);
    setError("");
    const ok = await login(email, password);
    if (!ok) setError("Invalid credentials or backend unreachable.");
    setBusy(false);
  }

  return (
    <div className="login-overlay">
      <form className="login-card panel glass" onSubmit={handleSubmit}>
        <h1 className="logo" style={{ margin: "0 auto 20px" }}>RO</h1>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Sign in to Research OS</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              style={{ marginTop: 4, width: "100%" }}
            />
          </label>
          <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginTop: 4, width: "100%" }}
            />
          </label>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="btn-purple"
          style={{ width: "100%", marginTop: 20 }}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
