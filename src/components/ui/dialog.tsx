"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100vw-2rem)] rounded-2xl p-0 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px] ${
        wide ? "max-w-2xl" : "max-w-md"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="닫기"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="max-h-[75dvh] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
