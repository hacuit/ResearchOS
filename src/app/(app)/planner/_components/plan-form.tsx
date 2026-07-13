"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createPlanItem, updatePlanItem } from "@/actions/planner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PRIORITY_LABELS, RECURRENCE_LABELS } from "@/lib/labels";

export type PlanFormData = {
  id: string;
  title: string;
  kind: string;
  date: string;
  priority: string;
  progress: number;
  notes: string;
};

export function PlanFormButton({
  defaultDate,
  item,
  onDone,
}: {
  defaultDate: string;
  item?: PlanFormData;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!item;

  async function handleAction(fd: FormData) {
    if (isEdit) await updatePlanItem(item.id, fd);
    else await createPlanItem(fd);
    setOpen(false);
    onDone?.();
  }

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium text-slate-400 hover:text-primary-600 cursor-pointer"
        >
          편집
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> 새 항목
        </Button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={isEdit ? "일정 편집" : "새 일정"}>
        <form action={handleAction} className="space-y-4">
          <Field label="제목" required>
            <Input name="title" defaultValue={item?.title} required maxLength={300} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="종류">
              <Select name="kind" defaultValue={item?.kind ?? "TODO"}>
                <option value="TODO">할 일</option>
                <option value="EVENT">일정</option>
              </Select>
            </Field>
            <Field label="우선순위">
              <Select name="priority" defaultValue={item?.priority ?? "MEDIUM"}>
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="날짜" required>
              <Input type="date" name="date" defaultValue={item?.date ?? defaultDate} required />
            </Field>
            {isEdit && (
              <Field label="진행률 (%)">
                <Input type="number" name="progress" min={0} max={100} defaultValue={item.progress} />
              </Field>
            )}
          </div>
          {!isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="반복">
                <Select name="recurrence" defaultValue="NONE">
                  {Object.entries(RECURRENCE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </Select>
              </Field>
              <Field label="반복 종료일">
                <Input type="date" name="recurrenceUntil" />
              </Field>
            </div>
          )}
          <Field label="메모">
            <Textarea name="notes" defaultValue={item?.notes} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit">{isEdit ? "저장" : "추가"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
