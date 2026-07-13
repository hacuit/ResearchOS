import Link from "next/link";
import { ChevronLeft, ChevronRight, FlaskConical, CalendarRange } from "lucide-react";
import { db } from "@/lib/db";
import { todayUtc, toDateInput, formatDateShort } from "@/lib/dates";
import { projectProgress } from "@/lib/progress";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from "@/lib/labels";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, Tag } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Gantt } from "@/components/gantt/gantt";
import { ProjectFormButton } from "./_components/project-form";
import { LogFormButton } from "./_components/log-form";
import { LogList } from "./_components/log-list";

export const metadata = { title: "연구" };
export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const today = todayUtc();
  const year = Number.parseInt(params.year ?? "", 10) || today.getUTCFullYear();

  const [projects, recentLogs] = await Promise.all([
    db.project.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        tasks: { orderBy: { sortOrder: "asc" } },
        milestones: { orderBy: { dueDate: "asc" } },
      },
    }),
    db.researchLog.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
  ]);

  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));
  const ganttProjects = projects.filter(
    (p) => !["DISCARDED", "STOPPED"].includes(p.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          진행 중 {projects.filter((p) => p.status === "IN_PROGRESS").length}개 ·
          전체 {projects.length}개 프로젝트
        </p>
        <ProjectFormButton />
      </div>

      {/* Gantt */}
      <Card>
        <CardTitle
          action={
            <div className="flex items-center gap-1">
              <Link
                href={`/research?year=${year - 1}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="이전 연도"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <span className="text-sm font-bold tabular-nums text-slate-700">{year}</span>
              <Link
                href={`/research?year=${year + 1}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="다음 연도"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          }
        >
          간트 차트
        </CardTitle>
        {ganttProjects.length > 0 ? (
          <Gantt projects={ganttProjects} year={year} today={today} />
        ) : (
          <EmptyState
            icon={CalendarRange}
            title="표시할 프로젝트가 없습니다"
            description="프로젝트를 만들고 시작일/목표일을 설정하면 간트 차트에 표시됩니다."
          />
        )}
      </Card>

      {/* Project cards */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="프로젝트가 없습니다"
          description="첫 연구 프로젝트를 만들어 진행 상황을 관리하세요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const progress = projectProgress(project.tasks, project.milestones);
            const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
            return (
              <Link key={project.id} href={`/research/${project.id}`}>
                <Card className="h-full transition hover:border-primary-200 hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: project.color ?? "#4f46e5" }}
                    />
                    <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                      {project.title}
                    </h3>
                    <Badge tone={PROJECT_STATUS_TONES[project.status]}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </Badge>
                  </div>
                  {project.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-slate-500">
                      {project.description}
                    </p>
                  )}
                  <ProgressBar value={progress} className="mb-3" />
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span>
                      태스크 {doneTasks}/{project.tasks.length}
                    </span>
                    {project.targetDate && (
                      <span>· 목표 {formatDateShort(project.targetDate)}</span>
                    )}
                  </div>
                  {project.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.tags.slice(0, 4).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Recent logs */}
      <Card>
        <CardTitle
          action={
            <LogFormButton
              projects={projects.map((p) => ({ id: p.id, title: p.title }))}
              defaultDate={toDateInput(today)}
            />
          }
        >
          최근 연구 기록
        </CardTitle>
        <LogList logs={recentLogs} projectTitles={projectTitles} />
      </Card>
    </div>
  );
}
