"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, Lightbulb, Pencil, Plus, Rocket } from "lucide-react";
import {
  createIdea,
  updateIdea,
  patchIdeaStatus,
  deleteIdea,
  promoteIdea,
} from "@/actions/ideas";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Tag } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { IDEA_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/cn";

export type IdeaData = {
  id: string;
  title: string;
  body: string;
  status: string;
  tags: string[];
  promotedProjectId: string;
  createdAt: string;
};

const COLUMNS: { status: string; title: string; accent: string }[] = [
  { status: "EXPLORING", title: "탐색중", accent: "border-t-primary-500" },
  { status: "ON_HOLD", title: "보류", accent: "border-t-amber-400" },
  { status: "PROMOTED", title: "승격됨", accent: "border-t-emerald-500" },
  { status: "DISCARDED", title: "폐기", accent: "border-t-slate-300" },
];

function IdeaFormDialog({
  open,
  onClose,
  idea,
}: {
  open: boolean;
  onClose: () => void;
  idea?: IdeaData;
}) {
  async function handleAction(fd: FormData) {
    if (idea) await updateIdea(idea.id, fd);
    else await createIdea(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={idea ? "아이디어 편집" : "새 아이디어"} wide>
      <form action={handleAction} className="space-y-4">
        <Field label="제목" required>
          <Input name="title" defaultValue={idea?.title} required maxLength={300} />
        </Field>
        <Field label="내용">
          <Textarea name="body" defaultValue={idea?.body} rows={5} placeholder="아이디어 설명, 배경, 검증 방법..." />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="상태">
            <Select name="status" defaultValue={idea?.status ?? "EXPLORING"}>
              {Object.entries(IDEA_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="태그 (쉼표로 구분)">
            <Input name="tags" defaultValue={idea?.tags.join(", ")} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{idea ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function IdeaCard({
  idea,
  onEdit,
}: {
  idea: IdeaData;
  onEdit: (idea: IdeaData) => void;
}) {
  const [, startTransition] = useTransition();
  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-primary-200">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{idea.title}</p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(idea)}
            className="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            title="편집"
          >
            <Pencil className="size-3.5" />
          </button>
          <ConfirmButton
            message={`"${idea.title}" 아이디어를 삭제할까요?`}
            action={async () => deleteIdea(idea.id)}
          />
        </div>
      </div>
      {idea.body && <p className="mt-1 line-clamp-3 text-xs text-slate-500">{idea.body}</p>}
      {idea.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {idea.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-50 pt-2">
        <select
          value={idea.status}
          onChange={(e) => {
            const status = e.target.value;
            startTransition(async () => patchIdeaStatus(idea.id, status));
          }}
          className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50 px-1.5 py-1 text-[11px] font-medium text-slate-500 outline-none"
        >
          {Object.entries(IDEA_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        {idea.status === "PROMOTED" && idea.promotedProjectId ? (
          <Link
            href={`/research/${idea.promotedProjectId}`}
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 hover:underline"
          >
            프로젝트 <ArrowUpRight className="size-3" />
          </Link>
        ) : (
          idea.status === "EXPLORING" && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`"${idea.title}"를 연구 프로젝트로 승격할까요?`)) {
                  startTransition(async () => promoteIdea(idea.id));
                }
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary-50 px-2 py-1 text-[11px] font-semibold text-primary-600 transition hover:bg-primary-100"
            >
              <Rocket className="size-3" /> 승격
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function IdeaBoard({ ideas }: { ideas: IdeaData[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IdeaData | undefined>();

  function edit(idea: IdeaData) {
    setEditing(idea);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <Lightbulb className="mr-1 inline size-4 text-amber-400" />
          {ideas.length}개의 아이디어
        </p>
        <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-4" /> 새 아이디어
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colIdeas = ideas.filter((i) => i.status === col.status);
          return (
            <div
              key={col.status}
              className={cn(
                "rounded-2xl border border-slate-200/60 border-t-4 bg-slate-50/60 p-3",
                col.accent
              )}
            >
              <p className="mb-2.5 flex items-center justify-between px-1 text-xs font-bold text-slate-600">
                {col.title}
                <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 ring-1 ring-slate-100">
                  {colIdeas.length}
                </span>
              </p>
              <div className="space-y-2">
                {colIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} onEdit={edit} />
                ))}
                {colIdeas.length === 0 && (
                  <p className="px-1 py-4 text-center text-[11px] text-slate-300">비어 있음</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <IdeaFormDialog key={editing?.id ?? "new"} open={formOpen} onClose={() => setFormOpen(false)} idea={editing} />
    </div>
  );
}
