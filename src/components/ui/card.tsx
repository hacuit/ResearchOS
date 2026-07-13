import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  action,
}: {
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-2", className)}>
      <h2 className="text-sm font-bold text-slate-900">{children}</h2>
      {action}
    </div>
  );
}

const TINTS = {
  indigo: "text-primary-500",
  violet: "text-accent-500",
  green: "text-emerald-500",
  amber: "text-amber-500",
  red: "text-red-500",
  slate: "text-slate-400",
} as const;

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tint = "indigo",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: LucideIcon;
  tint?: keyof typeof TINTS;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <Icon className={cn("size-4 shrink-0", TINTS[tint])} />
      </div>
      <p className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight text-slate-900">
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>}
    </Card>
  );
}
