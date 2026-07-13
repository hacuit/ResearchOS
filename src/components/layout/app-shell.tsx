"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FlaskConical,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { NAV_ITEMS, pageTitle } from "./nav";
import { cn } from "@/lib/cn";

const COLLAPSE_KEY = "ros:sidebar-collapsed";

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              collapsed && "justify-center px-0",
              active
                ? "bg-primary-50 text-primary-700"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-600" />
            )}
            <Icon className={cn("size-5 shrink-0", active && "text-primary-600")} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-5 py-5", collapsed && "justify-center px-0")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-md">
        <FlaskConical className="size-5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-slate-900">ResearchOS</p>
          <p className="text-[11px] text-slate-400">Research Dashboard</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-slate-200/80 bg-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <Brand collapsed={collapsed} />
        <NavLinks collapsed={collapsed} />
        <div className={cn("border-t border-slate-100 p-3", collapsed && "px-2")}>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" />
            ) : (
              <>
                <PanelLeftClose className="size-5" />
                <span>메뉴 접기</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="메뉴 닫기"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks collapsed={false} onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="size-5" />
                <span>로그아웃</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur lg:px-8 no-print">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="메뉴 열기"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="flex-1 truncate text-base font-bold text-slate-900">
            {pageTitle(pathname)}
          </h1>
          <span className="hidden text-xs text-slate-400 sm:block">
            {new Intl.DateTimeFormat("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "long",
            }).format(new Date())}
          </span>
          <button
            type="button"
            onClick={logout}
            title="로그아웃"
            className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:block cursor-pointer"
          >
            <LogOut className="size-4.5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
