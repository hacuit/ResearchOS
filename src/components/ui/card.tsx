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
  indigo: "bg-primary-50 text-primary-600",
  violet: "bg-accent-100 text-accent-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  slate: "bg-slate-100 text-slate-600",
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
    <Card className="flex items-center gap-4 p-4">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          TINTS[tint]
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
        {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
      </div>
    </Card>
  );
}
