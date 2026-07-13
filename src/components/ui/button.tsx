import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-50",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-primary-300 hover:text-primary-700 disabled:opacity-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9.5 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition cursor-pointer disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
