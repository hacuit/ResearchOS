"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { createTask, updateTask, patchTask, deleteTask } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  TASK_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
} from "@/lib/labels";

export type TaskRowData = {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  startDate: string;
  dueDate: string;
  notes: string;
  overdue: boolean;
};

function TaskFormDialog({
  open,
  onClose,
  projectId,
  task,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: TaskRowData;
}) {
  async function handleAction(fd: FormData) {
    if (task) await updateTask(task.id, fd);
    else await createTask(projectId, fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={task ? "태스크 편집" : "새 태스크"}>
      <form action={handleAction} className="space-y-4">
        <Field label="제목" required>
          <Input name="title" defaultValue={task?.title} required maxLength={300} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="상태">
            <Select name="status" defaultValue={task?.status ?? "TODO"}>
              {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="우선순위">
            <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="시작일">
            <Input type="date" name="startDate" defaultValue={task?.startDate} />
          </Field>
          <Field label="마감일">
            <Input type="date" name="dueDate" defaultValue={task?.dueDate} />
          </Field>
        </div>
        <Field label={`진행률 (%)`}>
          <Input
            type="number"
            name="progress"
            min={0}
            max={100}
            defaultValue={task?.progress ?? 0}
          />
        </Field>
        <Field label="메모">
          <Textarea name="notes" defaultValue={task?.notes} rows={3} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{task ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function StatusSelect({ task }: { task: TaskRowData }) {
  const [, startTransition] = useTransition();
  return (
    <select
      value={task.status}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          await patchTask(task.id, { status });
        });
      }}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-primary-400"
    >
      {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

function ProgressInput({ task }: { task: TaskRowData }) {
  const [value, setValue] = useState(task.progress);
  const [, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onMouseUp={() => startTransition(async () => patchTask(task.id, { progress: value }))}
        onTouchEnd={() => startTransition(async () => patchTask(task.id, { progress: value }))}
        className="h-1.5 w-24 cursor-pointer accent-indigo-600"
        disabled={task.status === "DONE"}
      />
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-500">
        {task.status === "DONE" ? 100 : value}%
      </span>
    </div>
  );
}

export function TaskTable({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: TaskRowData[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskRowData | undefined>();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">{tasks.length}개 태스크</p>
        <Button size="sm" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-3.5" /> 태스크 추가
        </Button>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-semibold">태스크</th>
              <th className="pb-2 pr-3 font-semibold">상태</th>
              <th className="pb-2 pr-3 font-semibold">우선순위</th>
              <th className="pb-2 pr-3 font-semibold">진행률</th>
              <th className="pb-2 pr-3 font-semibold">마감</th>
              <th className="pb-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="group border-b border-slate-50 last:border-0">
                <td className="max-w-64 py-2.5 pr-3">
                  <p className="truncate font-medium text-slate-800" title={task.title}>
                    {task.title}
                  </p>
                  {task.notes && (
                    <p className="truncate text-xs text-slate-400" title={task.notes}>
                      {task.notes}
                    </p>
                  )}
                </td>
                <td className="py-2.5 pr-3"><StatusSelect task={task} /></td>
                <td className="py-2.5 pr-3">
                  <Badge tone={PRIORITY_TONES[task.priority as keyof typeof PRIORITY_TONES]}>
                    {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                  </Badge>
                </td>
                <td className="py-2.5 pr-3"><ProgressInput task={task} /></td>
                <td className="py-2.5 pr-3">
                  <span className={task.overdue ? "text-xs font-semibold text-red-500" : "text-xs text-slate-500"}>
                    {task.dueDate || "-"}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => { setEditing(task); setFormOpen(true); }}
                      className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      title="편집"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <ConfirmButton
                      message={`"${task.title}" 태스크를 삭제할까요?`}
                      action={async () => deleteTask(task.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">{task.title}</p>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => { setEditing(task); setFormOpen(true); }}
                  className="rounded-lg p-1.5 text-slate-300 hover:text-slate-600"
                >
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton
                  message={`"${task.title}" 태스크를 삭제할까요?`}
                  action={async () => deleteTask(task.id)}
                />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusSelect task={task} />
              <Badge tone={PRIORITY_TONES[task.priority as keyof typeof PRIORITY_TONES]}>
                {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
              </Badge>
              {task.dueDate && (
                <span className={task.overdue ? "text-xs font-semibold text-red-500" : "text-xs text-slate-400"}>
                  ~{task.dueDate}
                </span>
              )}
            </div>
            <div className="mt-2"><ProgressInput task={task} /></div>
          </div>
        ))}
      </div>

      <TaskFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={projectId}
        task={editing}
      />
    </div>
  );
}
