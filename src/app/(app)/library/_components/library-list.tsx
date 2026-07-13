"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark, ExternalLink, Pencil, Pin, Plus } from "lucide-react";
import {
  createLibraryItem,
  updateLibraryItem,
  togglePin,
  deleteLibraryItem,
} from "@/actions/library";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Tag } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export type LibraryData = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  category: string;
  tags: string[];
  pinned: boolean;
};

function ItemFormDialog({
  open,
  onClose,
  item,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  item?: LibraryData;
  categories: string[];
}) {
  async function handleAction(fd: FormData) {
    if (item) await updateLibraryItem(item.id, fd);
    else await createLibraryItem(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={item ? "항목 편집" : "새 항목"}>
      <form action={handleAction} className="space-y-4">
        <Field label="제목" required>
          <Input name="title" defaultValue={item?.title} required maxLength={300} />
        </Field>
        <Field label="URL">
          <Input type="url" name="url" defaultValue={item?.url} placeholder="https://..." />
        </Field>
        <Field label="메모/스니펫">
          <Textarea name="snippet" defaultValue={item?.snippet} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="분류">
            <Input name="category" defaultValue={item?.category} list="library-categories" placeholder="도구 / 학회 / 행정..." />
            <datalist id="library-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="태그 (쉼표로 구분)">
            <Input name="tags" defaultValue={item?.tags.join(", ")} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{item ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function LibraryList({
  items,
  categories,
}: {
  items: LibraryData[];
  categories: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryData | undefined>();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/library?${next.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          defaultValue={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="검색..."
          className="w-full sm:w-64"
        />
        <Select value={category} onChange={(e) => setParam("category", e.target.value)} className="w-auto">
          <option value="">모든 분류</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <div className="ml-auto">
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
            <Plus className="size-4" /> 새 항목
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="저장된 항목이 없습니다"
          description="유용한 링크, 코드 스니펫, 정보를 모아두세요."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex flex-col rounded-2xl border bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:border-primary-200",
                item.pinned ? "border-primary-200 ring-1 ring-primary-100" : "border-slate-200/80"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold text-slate-800">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary-700 hover:underline"
                    >
                      {item.title}
                      <ExternalLink className="ml-1 inline size-3 text-slate-300" />
                    </a>
                  ) : (
                    item.title
                  )}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    startTransition(async () => togglePin(item.id, !item.pinned))
                  }
                  className={cn(
                    "shrink-0 rounded-lg p-1 transition cursor-pointer",
                    item.pinned
                      ? "text-primary-500"
                      : "text-slate-200 opacity-0 hover:text-primary-400 group-hover:opacity-100"
                  )}
                  title={item.pinned ? "고정 해제" : "고정"}
                >
                  <Pin className={cn("size-4", item.pinned && "fill-primary-500")} />
                </button>
              </div>
              {item.snippet && (
                <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-xs text-slate-500">
                  {item.snippet}
                </p>
              )}
              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {item.category && <Badge tone="indigo">{item.category}</Badge>}
                  {item.tags.slice(0, 3).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => { setEditing(item); setFormOpen(true); }}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    title="편집"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <ConfirmButton
                    message={`"${item.title}" 항목을 삭제할까요?`}
                    action={async () => deleteLibraryItem(item.id)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        item={editing}
        categories={categories}
      />
    </div>
  );
}
