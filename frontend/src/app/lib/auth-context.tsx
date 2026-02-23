"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { API_BASE } from "./api";

type UserProfile = { id: string; email: string; role: string; workspace_id: string };

type AuthContextType = {
  token: string;
  user: UserProfile | null;
  headers: Record<string, string>;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const headers = useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  const isAuthenticated = !!token && !!user;

  const fetchProfile = useCallback(async (t: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE}/me`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      return (await res.json()) as UserProfile;
    } catch {
      return null;
    }
  }, []);

  const doLogin = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token: string };
      return data.access_token;
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const t = await doLogin(email, password);
    if (!t) return false;
    const profile = await fetchProfile(t);
    if (!profile) return false;
    setToken(t);
    setUser(profile);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("access_token", t);
      window.localStorage.setItem("owner_email", email);
      window.localStorage.setItem("owner_password", password);
    }
    return true;
  }, [doLogin, fetchProfile]);

  const logout = useCallback(() => {
    setToken("");
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
    }
  }, []);

  useEffect(() => {
    async function boot() {
      if (typeof window === "undefined") { setIsLoading(false); return; }

      // 1. Try existing token
      const savedToken = window.localStorage.getItem("access_token");
      if (savedToken) {
        const profile = await fetchProfile(savedToken);
        if (profile) {
          setToken(savedToken);
          setUser(profile);
          setIsLoading(false);
          return;
        }
      }

      // 2. Try auto-login with saved credentials
      const email = window.localStorage.getItem("owner_email") || "dhkwon@dgist.ac.kr";
      const password = window.localStorage.getItem("owner_password") || "asdf";
      const t = await doLogin(email, password);
      if (t) {
        const profile = await fetchProfile(t);
        if (profile) {
          setToken(t);
          setUser(profile);
          window.localStorage.setItem("access_token", t);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
    }
    void boot();
  }, [fetchProfile, doLogin]);

  const value = useMemo<AuthContextType>(
    () => ({ token, user, headers, isAuthenticated, isLoading, login, logout }),
    [token, user, headers, isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
