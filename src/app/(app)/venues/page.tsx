import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Send,
} from "lucide-react";
import { db } from "@/lib/db";
import { deleteVenue, deleteVenueDate } from "@/actions/venues";
import { todayUtc, formatDateKo } from "@/lib/dates";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  VenueFormButton,
  VenueDateAddButton,
} from "./_components/venue-form";
import { VenueTimeline } from "./_components/venue-timeline";

export const metadata = { title: "학회/저널" };
export const dynamic = "force-dynamic";

export default async function VenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const today = todayUtc();
  const year = Number.parseInt(params.year ?? "", 10) || today.getUTCFullYear();

  const venues = await db.venue.findMany({
    orderBy: { sortOrder: "asc" },
    include: { dates: { orderBy: { date: "asc" } } },
  });

  const timelineVenues = venues
    .filter((v) => v.dates.length > 0)
    .map((v) => ({
      id: v.id,
      name: v.name,
      color: v.color ?? "#4f46e5",
      dates: v.dates.map((d) => ({
        id: d.id,
        kind: d.kind,
        date: d.date,
        endDate: d.endDate,
        note: d.note ?? "",
      })),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          마감·개최 일정은 수동 관리 항목입니다. 시드된 날짜는 예시이니 공식
          사이트에서 확인 후 수정하세요.
        </p>
        <VenueFormButton />
      </div>

      {/* Timeline */}
      <Card>
        <CardTitle
          action={
            <div className="flex items-center gap-1">
              <Link
                href={`/venues?year=${year - 1}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="이전 연도"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <span className="text-sm font-bold tabular-nums text-slate-700">{year}</span>
              <Link
                href={`/venues?year=${year + 1}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="다음 연도"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          }
        >
          연간 일정 타임라인
        </CardTitle>
        {timelineVenues.length > 0 ? (
          <VenueTimeline venues={timelineVenues} year={year} today={today} />
        ) : (
          <EmptyState
            icon={Globe}
            title="일정이 없습니다"
            description="학회를 추가하고 마감/개최 일정을 등록하세요."
          />
        )}
      </Card>

      {/* Venue cards */}
      {venues.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="등록된 학회/저널이 없습니다"
          description="주요 학회의 마감 일정과 제출 사이트를 한곳에서 관리하세요."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => {
            const upcoming = venue.dates.filter(
              (d) => d.kind.includes("마감") && d.date >= today
            );
            const nextDeadline = upcoming[0] ?? null;
            const dday = nextDeadline
              ? Math.round((nextDeadline.date.getTime() - today.getTime()) / 86400000)
              : null;
            return (
              <div
                key={venue.id}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: venue.color ?? "#4f46e5" }}
                    />
                    <h3 className="truncate text-sm font-bold text-slate-900">{venue.name}</h3>
                    <Badge tone={venue.type === "JOURNAL" ? "violet" : "indigo"}>
                      {venue.type === "JOURNAL" ? "저널" : "학회"}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                    <VenueFormButton
                      venue={{
                        id: venue.id,
                        name: venue.name,
                        fullName: venue.fullName ?? "",
                        type: venue.type,
                        field: venue.field ?? "",
                        siteUrl: venue.siteUrl ?? "",
                        submitUrl: venue.submitUrl ?? "",
                        color: venue.color ?? "#4f46e5",
                        note: venue.note ?? "",
                      }}
                    />
                    <ConfirmButton
                      message={`"${venue.name}"와 등록된 일정을 모두 삭제할까요?`}
                      action={async () => {
                        "use server";
                        await deleteVenue(venue.id);
                      }}
                    />
                  </div>
                </div>
                {venue.fullName && (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-400" title={venue.fullName}>
                    {venue.fullName}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {venue.field && <Badge tone="slate">{venue.field}</Badge>}
                  {dday !== null && (
                    <Badge tone={dday <= 14 ? "red" : dday <= 45 ? "amber" : "green"}>
                      {nextDeadline!.kind} D-{dday}
                    </Badge>
                  )}
                  {venue.type === "JOURNAL" && venue.dates.length === 0 && (
                    <Badge tone="green">상시 제출</Badge>
                  )}
                </div>
                {venue.note && <p className="mt-2 text-xs text-slate-400">{venue.note}</p>}

                {/* Dates */}
                {venue.dates.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-slate-50 pt-2.5">
                    {venue.dates.map((d) => (
                      <li key={d.id} className="group/date flex items-center gap-2 text-xs">
                        <span
                          className="size-1.5 shrink-0 rotate-45 rounded-[2px]"
                          style={{
                            backgroundColor: d.kind.includes("마감")
                              ? "#ef4444"
                              : d.kind.includes("발표")
                                ? "#f59e0b"
                                : (venue.color ?? "#64748b"),
                          }}
                        />
                        <span className="w-24 shrink-0 font-semibold text-slate-600">{d.kind}</span>
                        <span className={d.date < today ? "text-slate-300 line-through" : "text-slate-500"}>
                          {formatDateKo(d.date)}
                          {d.endDate && ` ~ ${formatDateKo(d.endDate)}`}
                        </span>
                        {d.note && (
                          <span className="truncate text-[10px] text-slate-300" title={d.note}>
                            {d.note}
                          </span>
                        )}
                        <ConfirmButton
                          message={`${venue.name} "${d.kind}" 일정을 삭제할까요?`}
                          action={async () => {
                            "use server";
                            await deleteVenueDate(d.id);
                          }}
                          className="ml-auto p-1 opacity-0 group-hover/date:opacity-100"
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* Footer links */}
                <div className="mt-auto flex items-center gap-2 pt-3">
                  {venue.siteUrl && (
                    <a
                      href={venue.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-700"
                    >
                      <Globe className="size-3" /> 공식 사이트
                    </a>
                  )}
                  {venue.submitUrl && (
                    <a
                      href={venue.submitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-primary-700"
                    >
                      <Send className="size-3" /> 제출 사이트
                      <ExternalLink className="size-2.5 opacity-70" />
                    </a>
                  )}
                  <span className="ml-auto">
                    <VenueDateAddButton venueId={venue.id} venueName={venue.name} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
