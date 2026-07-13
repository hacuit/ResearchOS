"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ExternalLink, Pencil, Plus, Star } from "lucide-react";
import { createPaper, updatePaper, patchPaperStatus, deletePaper } from "@/actions/papers";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Tag } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { READING_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/cn";

export type PaperData = {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number | null;
  url: string;
  doi: string;
  status: string;
  rating: number | null;
  tags: string[];
  category: string;
  summaryHtml: string;
  summaryMd: string;
  notes: string;
};

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-[11px] text-slate-300">-</span>;
  return (
    <span className="inline-flex items-center gap-px" title={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
          )}
        />
      ))}
    </span>
  );
}

function PaperFormDialog({
  open,
  onClose,
  paper,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  paper?: PaperData;
  categories: string[];
}) {
  async function handleAction(fd: FormData) {
    if (paper) await updatePaper(paper.id, fd);
    else await createPaper(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={paper ? "논문 편집" : "논문 추가"} wide>
      <form action={handleAction} className="space-y-4">
        <Field label="제목" required>
          <Input name="title" defaultValue={paper?.title} required maxLength={500} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="저자">
            <Input name="authors" defaultValue={paper?.authors} placeholder="Frantar et al." />
          </Field>
          <Field label="학회/저널">
            <Input name="venue" defaultValue={paper?.venue} placeholder="NeurIPS" />
          </Field>
          <Field label="연도">
            <Input type="number" name="year" defaultValue={paper?.year ?? ""} min={1950} max={2100} />
          </Field>
          <Field label="분류">
            <Input name="category" defaultValue={paper?.category} list="paper-categories" placeholder="양자화" />
            <datalist id="paper-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="URL">
            <Input type="url" name="url" defaultValue={paper?.url} placeholder="https://arxiv.org/..." />
          </Field>
          <Field label="DOI">
            <Input name="doi" defaultValue={paper?.doi} />
          </Field>
          <Field label="읽기 상태">
            <Select name="status" defaultValue={paper?.status ?? "TO_READ"}>
              {Object.entries(READING_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="평점 (1-5)">
            <Select name="rating" defaultValue={paper?.rating ?? ""}>
              <option value="">없음</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{"★".repeat(n)}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="태그 (쉼표로 구분)">
          <Input name="tags" defaultValue={paper?.tags.join(", ")} />
        </Field>
        <Field label="요약 (Markdown)">
          <Textarea name="summaryMd" defaultValue={paper?.summaryMd} rows={4} placeholder="**핵심**: ..." />
        </Field>
        <Field label="메모">
          <Textarea name="notes" defaultValue={paper?.notes} rows={2} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{paper ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function StatusSelect({ paper }: { paper: PaperData }) {
  const [, startTransition] = useTransition();
  return (
    <select
      value={paper.status}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => patchPaperStatus(paper.id, status));
      }}
      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-primary-400"
    >
      {Object.entries(READING_STATUS_LABELS).map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}

export function PaperList({
  papers,
  categories,
  totalCount,
}: {
  papers: PaperData[];
  categories: string[];
  totalCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaperData | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);

  const q = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/papers?${next.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          defaultValue={q}
          onChange={(e) => setParam("q", e.target.value)}
          placeholder="제목/저자 검색..."
          className="w-full sm:w-64"
        />
        <Select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="w-auto"
        >
          <option value="">모든 상태</option>
          {Object.entries(READING_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => setParam("category", e.target.value)}
          className="w-auto"
        >
          <option value="">모든 분류</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        <span className="text-xs text-slate-400">
          {papers.length}/{totalCount}편
        </span>
        <div className="ml-auto">
          <Button onClick={() => { setEditing(undefined); setFormOpen(true); }}>
            <Plus className="size-4" /> 논문 추가
          </Button>
        </div>
      </div>

      {papers.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="논문이 없습니다"
          description="읽은 논문과 읽을 논문을 등록해 리뷰를 관리하세요."
        />
      ) : (
        <div className="space-y-2">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="group rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === paper.id ? null : paper.id)}
                    className="block w-full cursor-pointer text-left"
                  >
                    <p className="text-sm font-semibold text-slate-800 hover:text-primary-700">
                      {paper.title}
                    </p>
                  </button>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {[paper.authors, paper.venue, paper.year].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {paper.category && <Badge tone="violet">{paper.category}</Badge>}
                    <Stars rating={paper.rating} />
                    {paper.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center gap-1">
                    {paper.url && (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-primary-600"
                        title="원문 열기"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => { setEditing(paper); setFormOpen(true); }}
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 cursor-pointer"
                      title="편집"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <ConfirmButton
                      message={`"${paper.title}" 논문을 삭제할까요?`}
                      action={async () => deletePaper(paper.id)}
                      className="opacity-0 group-hover:opacity-100"
                    />
                  </div>
                  <StatusSelect paper={paper} />
                </div>
              </div>
              {expanded === paper.id && (paper.summaryHtml || paper.notes) && (
                <div className="border-t border-slate-100 px-4 py-3">
                  {paper.summaryHtml && (
                    <div
                      className="md-body"
                      dangerouslySetInnerHTML={{ __html: paper.summaryHtml }}
                    />
                  )}
                  {paper.notes && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      {paper.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PaperFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        paper={editing}
        categories={categories}
      />
    </div>
  );
}
