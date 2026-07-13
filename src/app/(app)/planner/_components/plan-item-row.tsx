"use client";

import { useTransition } from "react";
import { CalendarDays, Repeat } from "lucide-react";
import { togglePlanDone, deletePlanItem, deletePlanSeries } from "@/actions/planner";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PRIORITY_LABELS, PRIORITY_TONES } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { PlanFormButton, type PlanFormData } from "./plan-form";

export type PlanRowData = PlanFormData & {
  done: boolean;
  isEvent: boolean;
  seriesId: string;
  overdue: boolean;
};

export function PlanItemRow({ item }: { item: PlanRowData }) {
  const [, startTransition] = useTransition();

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      {item.isEvent ? (
        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-accent-500">
          <CalendarDays className="size-4" />
        </span>
      ) : (
        <input
          type="checkbox"
          checked={item.done}
          onChange={(e) => {
            const done = e.target.checked;
            startTransition(async () => togglePlanDone(item.id, done));
          }}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-indigo-600"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={cn(
              "text-sm font-medium",
              item.done ? "text-slate-400 line-through" : "text-slate-800"
            )}
          >
            {item.title}
          </p>
          {item.seriesId && <Repeat className="size-3 text-slate-300" />}
          <Badge tone={PRIORITY_TONES[item.priority as keyof typeof PRIORITY_TONES]}>
            {PRIORITY_LABELS[item.priority as keyof typeof PRIORITY_LABELS]}
          </Badge>
          {item.overdue && <Badge tone="red">지연</Badge>}
        </div>
        {item.notes && <p className="mt-0.5 truncate text-xs text-slate-400">{item.notes}</p>}
        {!item.isEvent && !item.done && item.progress > 0 && (
          <ProgressBar value={item.progress} className="mt-1.5 max-w-44" />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <PlanFormButton defaultDate={item.date} item={item} />
        <ConfirmButton
          message={
            item.seriesId
              ? `"${item.title}"은 반복 일정입니다. 이 항목만 삭제할까요?\n(확인=이 항목만, 시리즈 전체 삭제는 별도 버튼)`
              : `"${item.title}" 항목을 삭제할까요?`
          }
          action={async () => deletePlanItem(item.id)}
        />
        {item.seriesId && (
          <ConfirmButton
            title="시리즈 전체 삭제"
            message={`"${item.title}" 반복 시리즈 전체를 삭제할까요?`}
            action={async () => deletePlanSeries(item.seriesId)}
          >
            <Repeat className="size-4" />
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
