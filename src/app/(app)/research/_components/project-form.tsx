"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createProject, updateProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";

export type ProjectFormData = {
  id: string;
  title: string;
  description: string;
  status: string;
  color: string;
  startDate: string;
  targetDate: string;
  tags: string;
};

const COLORS = [
  { value: "#4f46e5", label: "인디고" },
  { value: "#8b5cf6", label: "바이올렛" },
  { value: "#a5b4fc", label: "라이트 인디고" },
  { value: "#10b981", label: "에메랄드" },
  { value: "#f59e0b", label: "앰버" },
  { value: "#f43f5e", label: "로즈" },
];

export function ProjectFormButton({ project }: { project?: ProjectFormData }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!project;

  async function handleAction(fd: FormData) {
    if (isEdit) {
      await updateProject(project.id, fd);
      setOpen(false);
    } else {
      await createProject(fd); // redirects to the new project
    }
  }

  return (
    <>
      {isEdit ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Pencil className="size-3.5" /> 편집
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> 새 프로젝트
        </Button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "프로젝트 편집" : "새 프로젝트"}
      >
        <form action={handleAction} className="space-y-4">
          <Field label="제목" required>
            <Input name="title" defaultValue={project?.title} required maxLength={200} />
          </Field>
          <Field label="설명">
            <Textarea name="description" defaultValue={project?.description} rows={3} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="상태">
              <Select name="status" defaultValue={project?.status ?? "PLANNED"}>
                {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="색상 (간트)">
              <Select name="color" defaultValue={project?.color ?? "#4f46e5"}>
                {COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="시작일">
              <Input type="date" name="startDate" defaultValue={project?.startDate} />
            </Field>
            <Field label="목표일">
              <Input type="date" name="targetDate" defaultValue={project?.targetDate} />
            </Field>
          </div>
          <Field label="태그 (쉼표로 구분)">
            <Input name="tags" defaultValue={project?.tags} placeholder="quantization, on-device" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit">{isEdit ? "저장" : "만들기"}</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
