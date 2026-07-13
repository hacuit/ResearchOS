import Link from "next/link";
import type { Project, Task } from "@prisma/client";
import { cn } from "@/lib/cn";

type ProjectWithTasks = Project & { tasks: Task[] };

const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const TASK_BAR_COLORS: Record<Task["status"], string> = {
  DONE: "bg-emerald-400",
  IN_PROGRESS: "bg-primary-500",
  TODO: "bg-slate-300",
  ON_HOLD: "bg-amber-400",
};

/** Fraction [0,1] of the position of `date` within `year`. */
function frac(date: Date, year: number): number {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return (date.getTime() - start) / (end - start);
}

function barStyle(
  start: Date | null,
  end: Date | null,
  year: number
): { left: string; width: string } | null {
  if (!start && !end) return null;
  const s = start ? frac(start, year) : 0;
  // end date is inclusive: extend one day
  const e = end ? frac(new Date(end.getTime() + 86400000), year) : 1;
  const left = Math.max(0, Math.min(1, s));
  const right = Math.max(0, Math.min(1, e));
  if (right <= left) return null;
  return { left: `${left * 100}%`, width: `${(right - left) * 100}%` };
}

function MonthGrid() {
  return (
    <div className="pointer-events-none absolute inset-0 grid grid-cols-12">
      {MONTH_LABELS.map((m, i) => (
        <div key={m} className={cn("border-slate-100", i > 0 && "border-l")} />
      ))}
    </div>
  );
}

export function Gantt({
  projects,
  year,
  today,
}: {
  projects: ProjectWithTasks[];
  year: number;
  today: Date;
}) {
  const todayFrac = frac(today, year);
  const showToday = todayFrac >= 0 && todayFrac <= 1;

  return (
    <div className="overflow-x-auto scroll-thin">
      <div className="min-w-[760px]">
        {/* Month header */}
        <div className="flex">
          <div className="w-44 shrink-0" />
          <div className="relative grid flex-1 grid-cols-12 border-b border-slate-200 pb-1.5">
            {MONTH_LABELS.map((m) => (
              <span key={m} className="text-center text-[11px] font-medium text-slate-400">
                {m}
              </span>
            ))}
          </div>
        </div>

        {projects.map((project) => {
          const pBar = barStyle(project.startDate, project.targetDate, year);
          return (
            <div key={project.id} className="border-b border-slate-50 py-1 last:border-0">
              {/* Project row */}
              <div className="flex items-center">
                <div className="w-44 shrink-0 pr-3">
                  <Link
                    href={`/research/${project.id}`}
                    className="block truncate text-xs font-bold text-slate-700 hover:text-primary-600"
                    title={project.title}
                  >
                    {project.title}
                  </Link>
                </div>
                <div className="relative h-7 flex-1">
                  <MonthGrid />
                  {showToday && (
                    <span
                      className="absolute inset-y-0 z-10 w-px bg-red-400"
                      style={{ left: `${todayFrac * 100}%` }}
                    />
                  )}
                  {pBar && (
                    <span
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full opacity-90"
                      style={{
                        ...pBar,
                        backgroundColor: project.color ?? "#4f46e5",
                      }}
                      title={project.title}
                    />
                  )}
                </div>
              </div>
              {/* Task rows */}
              {project.tasks.map((task) => {
                const tBar = barStyle(task.startDate, task.dueDate, year);
                if (!tBar) return null;
                return (
                  <div key={task.id} className="flex items-center">
                    <div className="w-44 shrink-0 pl-3 pr-3">
                      <p className="truncate text-[11px] text-slate-400" title={task.title}>
                        {task.title}
                      </p>
                    </div>
                    <div className="relative h-5 flex-1">
                      <MonthGrid />
                      {showToday && (
                        <span
                          className="absolute inset-y-0 z-10 w-px bg-red-300/70"
                          style={{ left: `${todayFrac * 100}%` }}
                        />
                      )}
                      <span
                        className={cn(
                          "absolute top-1/2 h-2 -translate-y-1/2 rounded-full",
                          TASK_BAR_COLORS[task.status]
                        )}
                        style={tBar}
                        title={`${task.title} (${task.progress}%)`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-primary-500" /> 진행중
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-emerald-400" /> 완료
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-slate-300" /> 할 일
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-amber-400" /> 보류
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-px bg-red-400" /> 오늘
        </span>
      </div>
    </div>
  );
}
