"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconDashboard, IconAccess, IconProject, IconReports } from "./icons";

const sidebarTabs = [
  { icon: <IconDashboard />, label: "Dashboard", href: "/" },
  { icon: <IconProject />, label: "Project", href: "/project" },
  { icon: <IconReports />, label: "Reports", href: "/reports" },
  { icon: <IconAccess />, label: "Settings", href: "/access" },
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
