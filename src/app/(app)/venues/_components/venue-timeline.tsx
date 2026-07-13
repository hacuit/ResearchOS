import { cn } from "@/lib/cn";

export type TimelineVenue = {
  id: string;
  name: string;
  color: string;
  dates: {
    id: string;
    kind: string;
    date: Date;
    endDate: Date | null;
    note: string;
  }[];
};

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

function frac(date: Date, year: number): number {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return (date.getTime() - start) / (end - start);
}

function markerColor(kind: string): string {
  if (kind.includes("마감")) return "#ef4444";
  if (kind.includes("발표")) return "#f59e0b";
  return "#64748b";
}

export function VenueTimeline({
  venues,
  year,
  today,
}: {
  venues: TimelineVenue[];
  year: number;
  today: Date;
}) {
  const todayFrac = frac(today, year);
  const showToday = todayFrac >= 0 && todayFrac <= 1;

  return (
    <div className="overflow-x-auto scroll-thin">
      <div className="min-w-[720px]">
        {/* Month header */}
        <div className="flex">
          <div className="w-24 shrink-0" />
          <div className="grid flex-1 grid-cols-12 border-b border-slate-200 pb-1.5">
            {MONTH_LABELS.map((m) => (
              <span key={m} className="text-center text-[11px] font-medium text-slate-400">
                {m}
              </span>
            ))}
          </div>
        </div>

        {venues.map((venue) => {
          const inYear = venue.dates.filter(
            (d) =>
              d.date.getUTCFullYear() === year ||
              (d.endDate && d.endDate.getUTCFullYear() === year)
          );
          return (
            <div key={venue.id} className="flex items-center border-b border-slate-50 last:border-0">
              <div className="flex w-24 shrink-0 items-center gap-1.5 py-2 pr-2">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: venue.color }}
                />
                <span className="truncate text-xs font-bold text-slate-700">{venue.name}</span>
              </div>
              <div className="relative h-9 flex-1">
                {/* month gridlines */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
                  {MONTH_LABELS.map((m, i) => (
                    <div key={m} className={cn("border-slate-100", i > 0 && "border-l")} />
                  ))}
                </div>
                {showToday && (
                  <span
                    className="absolute inset-y-0 z-10 w-px bg-red-400"
                    style={{ left: `${todayFrac * 100}%` }}
                  />
                )}
                {inYear.map((d) => {
                  if (d.kind.includes("개최")) {
                    const s = Math.max(0, Math.min(1, frac(d.date, year)));
                    const e = Math.max(
                      0,
                      Math.min(
                        1,
                        frac(new Date((d.endDate ?? d.date).getTime() + 86400000 * 2), year)
                      )
                    );
                    if (e <= s) return null;
                    return (
                      <span
                        key={d.id}
                        className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full opacity-90"
                        style={{
                          left: `${s * 100}%`,
                          width: `${Math.max((e - s) * 100, 1.2)}%`,
                          backgroundColor: venue.color,
                        }}
                        title={`${venue.name} ${d.kind} ${d.date.toISOString().slice(0, 10)}${d.note ? ` · ${d.note}` : ""}`}
                      />
                    );
                  }
                  const f = frac(d.date, year);
                  if (f < 0 || f > 1) return null;
                  return (
                    <span
                      key={d.id}
                      className="absolute top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px]"
                      style={{ left: `${f * 100}%`, backgroundColor: markerColor(d.kind) }}
                      title={`${venue.name} ${d.kind} ${d.date.toISOString().slice(0, 10)}${d.note ? ` · ${d.note}` : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 rounded-[2px] bg-red-500" /> 제출 마감
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rotate-45 rounded-[2px] bg-amber-500" /> 결과 발표
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-5 rounded-full bg-primary-500" /> 개최 기간
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-red-400" /> 오늘
        </span>
      </div>
    </div>
  );
}
