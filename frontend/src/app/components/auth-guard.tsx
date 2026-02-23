"use client";

import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { LoginModal } from "./login-modal";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div style={{ textAlign: "center" }}>
          <h1 className="logo" style={{ margin: "0 auto 16px" }}>RO</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return <>{children}</>;
}
