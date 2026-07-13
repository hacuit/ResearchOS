import {
  LayoutDashboard,
  FlaskConical,
  Lightbulb,
  BookOpen,
  Bookmark,
  CalendarDays,
  HeartPulse,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/research", label: "연구", icon: FlaskConical },
  { href: "/ideas", label: "아이디어", icon: Lightbulb },
  { href: "/papers", label: "논문", icon: BookOpen },
  { href: "/library", label: "라이브러리", icon: Bookmark },
  { href: "/planner", label: "플래너", icon: CalendarDays },
  { href: "/routine", label: "루틴", icon: HeartPulse },
  { href: "/docs", label: "문서", icon: FileText },
  { href: "/settings", label: "설정", icon: Settings },
];

export function pageTitle(pathname: string): string {
  if (pathname === "/") return "대시보드";
  const item = NAV_ITEMS.find((n) => n.href !== "/" && pathname.startsWith(n.href));
  return item?.label ?? "ResearchOS";
}
