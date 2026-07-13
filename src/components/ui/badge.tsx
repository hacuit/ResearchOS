import { cn } from "@/lib/cn";

const TONES: Record<string, string> = {
  indigo: "bg-primary-50 text-primary-700 ring-primary-200",
  violet: "bg-accent-100 text-accent-700 ring-accent-300",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONES[tone] ?? TONES.slate,
        className
      )}
    >
      {children}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
      #{children}
    </span>
  );
}
