"use client";

import { useState, useTransition } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { createMilestone, toggleMilestone, deleteMilestone } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/cn";

export type MilestoneData = {
  id: string;
  title: string;
  kind: string;
  dueDate: string;
  done: boolean;
  link: string;
  overdue: boolean;
};

export function MilestoneList({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: MilestoneData[];
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleCreate(fd: FormData) {
    await createMilestone(projectId, fd);
    setOpen(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">{milestones.length}개 마일스톤</p>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> 추가
        </Button>
      </div>

      <ul className="space-y-2">
        {milestones.map((ms) => (
          <li
            key={ms.id}
            className="group flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5"
          >
            <input
              type="checkbox"
              checked={ms.done}
              onChange={(e) => {
                const done = e.target.checked;
                startTransition(async () => toggleMilestone(ms.id, done));
              }}
              className="size-4 shrink-0 cursor-pointer accent-indigo-600"
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm font-medium",
                  ms.done ? "text-slate-400 line-through" : "text-slate-800"
                )}
              >
                {ms.title}
              </p>
              <p className="text-[11px] text-slate-400">
                {ms.kind && <span className="mr-1.5">{ms.kind}</span>}
                <span className={cn(!ms.done && ms.overdue && "font-semibold text-red-500")}>
                  ~{ms.dueDate}
                </span>
              </p>
            </div>
            {ms.link && (
              <a
                href={ms.link}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-1.5 text-slate-300 hover:text-primary-600"
                title="링크 열기"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <ConfirmButton
              message={`"${ms.title}" 마일스톤을 삭제할까요?`}
              action={async () => deleteMilestone(ms.id)}
              className="opacity-0 group-hover:opacity-100"
            />
          </li>
        ))}
        {milestones.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            마일스톤이 없습니다
          </li>
        )}
      </ul>

      <Dialog open={open} onClose={() => setOpen(false)} title="새 마일스톤">
        <form action={handleCreate} className="space-y-4">
          <Field label="제목" required>
            <Input name="title" required maxLength={200} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="종류">
              <Input name="kind" placeholder="논문 / 발표 / 보고서..." />
            </Field>
            <Field label="마감일" required>
              <Input type="date" name="dueDate" required />
            </Field>
          </div>
          <Field label="링크">
            <Input type="url" name="link" placeholder="https://..." />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
