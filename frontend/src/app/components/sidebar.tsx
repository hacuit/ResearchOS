"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconDashboard, IconAccess, IconProject } from "./icons";

const sidebarTabs = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/" },
  { icon: <IconAccess />, label: "Access", href: "/access" },
  { icon: <IconProject />, label: "Project Detail", href: "/project" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
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
  );
}
