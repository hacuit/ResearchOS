"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createLog } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export function LogFormButton({
  projects,
  defaultProjectId,
  defaultDate,
}: {
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);

  async function handleCreate(fd: FormData) {
    await createLog(fd);
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" /> 기록 추가
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="연구 기록 추가" wide>
        <form action={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="날짜" required>
              <Input type="date" name="date" defaultValue={defaultDate} required />
            </Field>
            <Field label="프로젝트">
              <Select name="projectId" defaultValue={defaultProjectId ?? ""}>
                <option value="">(연결 안 함)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="제목" required>
            <Input name="title" required maxLength={300} placeholder="오늘의 실험 요약" />
          </Field>
          <Field label="내용 (Markdown)">
            <Textarea
              name="bodyMd"
              rows={8}
              placeholder={"## 오늘 한 일\n- ...\n\n## 이슈\n- ...\n\n## 내일 할 일\n- ..."}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
