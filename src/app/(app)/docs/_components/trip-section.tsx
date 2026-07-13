"use client";

import { useState } from "react";
import { MapPin, Pencil, Plus, Printer } from "lucide-react";
import { createTrip, updateTrip, deleteTrip } from "@/actions/docs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";

export type TripData = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  outcomesMd: string;
  outcomesHtml: string;
  expenses: number | null;
};

function TripFormDialog({
  open,
  onClose,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  trip?: TripData;
}) {
  async function handleAction(fd: FormData) {
    if (trip) await updateTrip(trip.id, fd);
    else await createTrip(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={trip ? "출장 보고서 편집" : "출장 보고서 작성"} wide>
      <form action={handleAction} className="space-y-4">
        <Field label="제목" required>
          <Input name="title" defaultValue={trip?.title} required maxLength={300} placeholder="국내 학회 참석" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="출장지" required>
            <Input name="destination" defaultValue={trip?.destination} required />
          </Field>
          <Field label="집행 경비 (원)">
            <Input type="number" name="expenses" defaultValue={trip?.expenses ?? ""} min={0} />
          </Field>
          <Field label="시작일" required>
            <Input type="date" name="startDate" defaultValue={trip?.startDate} required />
          </Field>
          <Field label="종료일" required>
            <Input type="date" name="endDate" defaultValue={trip?.endDate} required />
          </Field>
        </div>
        <Field label="출장 목적" required>
          <Input name="purpose" defaultValue={trip?.purpose} required maxLength={500} />
        </Field>
        <Field label="주요 성과 및 후속 조치 (Markdown)">
          <Textarea
            name="outcomesMd"
            defaultValue={trip?.outcomesMd}
            rows={7}
            placeholder={"## 주요 성과\n- ...\n\n## 후속 조치\n- ..."}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{trip ? "저장" : "저장"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function TripSection({ trips }: { trips: TripData[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TripData | undefined>();

  return (
    <div className="space-y-4">
      <div className="flex justify-end no-print">
        <Button size="sm" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-3.5" /> 출장 보고서 작성
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="출장 보고서가 없습니다"
          description="학회, 미팅 등 출장 기록을 보고서 형식으로 관리하세요."
        />
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <details key={trip.id} className="group rounded-2xl border border-slate-200/80 bg-white">
              <summary className="flex cursor-pointer items-start gap-3 p-5 [&::-webkit-details-marker]:hidden">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-accent-600">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{trip.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {trip.destination} · {trip.startDate} ~ {trip.endDate}
                    {trip.expenses !== null && ` · 경비 ${trip.expenses.toLocaleString("ko-KR")}원`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 no-print">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setEditing(trip); setFormOpen(true); }}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                    title="편집"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton
                    message={`"${trip.title}" 보고서를 삭제할까요?`}
                    action={async () => deleteTrip(trip.id)}
                  />
                </div>
              </summary>
              <div className="border-t border-slate-100 px-5 py-4">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">출장 목적</p>
                <p className="mb-3 text-sm text-slate-600">{trip.purpose}</p>
                {trip.outcomesHtml && (
                  <div className="md-body" dangerouslySetInnerHTML={{ __html: trip.outcomesHtml }} />
                )}
                <div className="mt-3 no-print">
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    <Printer className="size-3.5" /> 인쇄
                  </Button>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      <TripFormDialog key={editing?.id ?? "new"} open={formOpen} onClose={() => setFormOpen(false)} trip={editing} />
    </div>
  );
}
