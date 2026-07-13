"use client";

import { useState } from "react";
import { FileSignature, Pencil, Plus } from "lucide-react";
import { createProposal, updateProposal, deleteProposal } from "@/actions/docs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";

export type ProposalData = {
  id: string;
  title: string;
  agency: string;
  program: string;
  deadline: string;
  dday: number | null;
  budget: string;
  durationMonths: number | null;
  abstractMd: string;
  abstractHtml: string;
  status: string;
};

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  draft: { label: "작성중", tone: "slate" },
  submitted: { label: "제출됨", tone: "indigo" },
  accepted: { label: "선정", tone: "green" },
  rejected: { label: "탈락", tone: "red" },
};

function ProposalFormDialog({
  open,
  onClose,
  proposal,
}: {
  open: boolean;
  onClose: () => void;
  proposal?: ProposalData;
}) {
  async function handleAction(fd: FormData) {
    if (proposal) await updateProposal(proposal.id, fd);
    else await createProposal(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={proposal ? "제안서 정보 편집" : "제안서 기본 정보"} wide>
      <form action={handleAction} className="space-y-4">
        <Field label="과제명" required>
          <Input name="title" defaultValue={proposal?.title} required maxLength={300} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="지원 기관">
            <Input name="agency" defaultValue={proposal?.agency} placeholder="한국연구재단" />
          </Field>
          <Field label="사업명">
            <Input name="program" defaultValue={proposal?.program} placeholder="신진연구자지원사업" />
          </Field>
          <Field label="마감일">
            <Input type="date" name="deadline" defaultValue={proposal?.deadline} />
          </Field>
          <Field label="상태">
            <Select name="status" defaultValue={proposal?.status ?? "draft"}>
              {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="예산">
            <Input name="budget" defaultValue={proposal?.budget} placeholder="연 1.5억 x 3년" />
          </Field>
          <Field label="기간 (개월)">
            <Input type="number" name="durationMonths" defaultValue={proposal?.durationMonths ?? ""} min={1} />
          </Field>
        </div>
        <Field label="연구 개요 (Markdown)">
          <Textarea name="abstractMd" defaultValue={proposal?.abstractMd} rows={6} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">저장</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ProposalSection({ proposals }: { proposals: ProposalData[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProposalData | undefined>();

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button size="sm" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-3.5" /> 제안서 추가
        </Button>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="제안서가 없습니다"
          description="연구 과제 제안서의 기본 정보와 마감일을 관리하세요."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {proposals.map((p) => {
            const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.draft;
            return (
              <div
                key={p.id}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{p.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {[p.agency, p.program].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {p.dday !== null && p.status === "draft" && (
                      <Badge tone={p.dday <= 7 ? "red" : p.dday <= 30 ? "amber" : "slate"}>
                        {p.dday === 0 ? "D-DAY" : p.dday > 0 ? `D-${p.dday}` : `D+${-p.dday}`}
                      </Badge>
                    )}
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-slate-400">마감</dt>
                    <dd className="mt-0.5 text-xs font-bold text-slate-700">{p.deadline || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-slate-400">예산</dt>
                    <dd className="mt-0.5 truncate text-xs font-bold text-slate-700">{p.budget || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase text-slate-400">기간</dt>
                    <dd className="mt-0.5 text-xs font-bold text-slate-700">
                      {p.durationMonths ? `${p.durationMonths}개월` : "-"}
                    </dd>
                  </div>
                </dl>
                {p.abstractHtml && (
                  <div
                    className="md-body mt-3 line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: p.abstractHtml }}
                  />
                )}
                <div className="mt-3 flex items-center justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 no-print">
                  <button
                    type="button"
                    onClick={() => { setEditing(p); setFormOpen(true); }}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    title="편집"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton
                    message={`"${p.title}" 제안서를 삭제할까요?`}
                    action={async () => deleteProposal(p.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProposalFormDialog key={editing?.id ?? "new"} open={formOpen} onClose={() => setFormOpen(false)} proposal={editing} />
    </div>
  );
}
