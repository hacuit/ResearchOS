import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  className,
  tone = "indigo",
}: {
  value: number;
  className?: string;
  tone?: "indigo" | "violet" | "green";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "violet"
        ? "bg-accent-500"
        : clamped >= 100
          ? "bg-emerald-500"
          : "bg-primary-500";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-500">
        {clamped}%
      </span>
    </div>
  );
}
