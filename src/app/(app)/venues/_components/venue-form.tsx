"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Plus } from "lucide-react";
import {
  createVenue,
  updateVenue,
  createVenueDate,
} from "@/actions/venues";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export type VenueFormData = {
  id: string;
  name: string;
  fullName: string;
  type: string;
  field: string;
  siteUrl: string;
  submitUrl: string;
  color: string;
  note: string;
};

const VENUE_COLORS = [
  { value: "#4f46e5", label: "인디고" },
  { value: "#7c3aed", label: "바이올렛" },
  { value: "#0ea5e9", label: "스카이" },
  { value: "#10b981", label: "에메랄드" },
  { value: "#14b8a6", label: "틸" },
  { value: "#f59e0b", label: "앰버" },
  { value: "#f43f5e", label: "로즈" },
  { value: "#64748b", label: "슬레이트" },
];

export function VenueFormButton({ venue }: { venue?: VenueFormData }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!venue;

  async function handleAction(fd: FormData) {
    if (isEdit) await updateVenue(venue.id, fd);
    else await createVenue(fd);
    setOpen(false);
  }

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          title="편집"
        >
          <Pencil className="size-4" />
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> 새 학회/저널
        </Button>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={isEdit ? "학회/저널 편집" : "새 학회/저널"}
        wide
      >
        <form action={handleAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="약칭" required>
              <Input name="name" defaultValue={venue?.name} required maxLength={40} placeholder="ISSCC" />
            </Field>
            <Field label="구분">
              <Select name="type" defaultValue={venue?.type ?? "CONFERENCE"}>
                <option value="CONFERENCE">학회</option>
                <option value="JOURNAL">저널</option>
              </Select>
            </Field>
          </div>
          <Field label="정식 명칭">
            <Input name="fullName" defaultValue={venue?.fullName} maxLength={300} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="분야">
              <Input name="field" defaultValue={venue?.field} placeholder="회로 (IC)" />
            </Field>
            <Field label="색상 (타임라인)">
              <Select name="color" defaultValue={venue?.color ?? "#4f46e5"}>
                {VENUE_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="공식 사이트">
              <Input type="url" name="siteUrl" defaultValue={venue?.siteUrl} placeholder="https://..." />
            </Field>
            <Field label="제출 사이트">
              <Input type="url" name="submitUrl" defaultValue={venue?.submitUrl} placeholder="https://..." />
            </Field>
          </div>
          <Field label="메모">
            <Textarea name="note" defaultValue={venue?.note} rows={2} placeholder="상시 제출, 리뷰 기간 등" />
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

export function VenueDateAddButton({ venueId, venueName }: { venueId: string; venueName: string }) {
  const [open, setOpen] = useState(false);

  async function handleAction(fd: FormData) {
    await createVenueDate(venueId, fd);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary-600 transition hover:bg-primary-50"
      >
        <CalendarPlus className="size-3.5" /> 일정 추가
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`${venueName} 일정 추가`}>
        <form action={handleAction} className="space-y-4">
          <Field label="종류" required>
            <Input
              name="kind"
              required
              list="venue-date-kinds"
              placeholder="논문 마감 / Abstract 마감 / 결과 발표 / 개최"
            />
            <datalist id="venue-date-kinds">
              <option value="논문 마감" />
              <option value="Abstract 마감" />
              <option value="결과 발표" />
              <option value="개최" />
              <option value="카메라레디 마감" />
            </datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="날짜" required>
              <Input type="date" name="date" required />
            </Field>
            <Field label="종료일 (개최 기간)">
              <Input type="date" name="endDate" />
            </Field>
          </div>
          <Field label="메모">
            <Input name="note" placeholder="장소, 예상 여부 등" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit">추가</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
