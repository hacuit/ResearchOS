"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function ConfirmButton({
  message,
  action,
  className,
  children,
  title,
}: {
  message: string;
  action: () => Promise<void>;
  className?: string;
  children?: React.ReactNode;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      title={title ?? "삭제"}
      disabled={pending}
      onClick={() => {
        if (window.confirm(message)) {
          startTransition(async () => {
            await action();
          });
        }
      }}
      className={cn(
        "rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40 cursor-pointer",
        className
      )}
    >
      {children ?? <Trash2 className="size-4" />}
    </button>
  );
}
