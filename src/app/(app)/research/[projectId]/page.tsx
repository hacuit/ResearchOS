import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { db } from "@/lib/db";
import { deleteProject } from "@/actions/projects";
import { todayUtc, toDateInput, formatDateKo } from "@/lib/dates";
import { projectProgress, isOverdue } from "@/lib/progress";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/labels";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, Tag } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ProjectFormButton } from "../_components/project-form";
import { TaskTable, type TaskRowData } from "../_components/task-table";
import { MilestoneList, type MilestoneData } from "../_components/milestone-list";
import { LogFormButton } from "../_components/log-form";
import { LogList } from "../_components/log-list";

export const metadata = { title: "프로젝트" };
export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const today = todayUtc();

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: { orderBy: { sortOrder: "asc" } },
      milestones: { orderBy: { dueDate: "asc" } },
      logs: { orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 30 },
    },
  });
  if (!project) notFound();

  const progress = projectProgress(project.tasks, project.milestones);

  const taskRows: TaskRowData[] = project.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    startDate: toDateInput(t.startDate),
    dueDate: toDateInput(t.dueDate),
    notes: t.notes ?? "",
    overdue: isOverdue(t.dueDate, t.status === "DONE", today),
  }));

  const milestoneRows: MilestoneData[] = project.milestones.map((m) => ({
    id: m.id,
    title: m.title,
    kind: m.kind ?? "",
    dueDate: toDateInput(m.dueDate),
    done: m.done,
    link: m.link ?? "",
    overdue: isOverdue(m.dueDate, m.done, today),
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/research"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-primary-600"
      >
        <ArrowLeft className="size-3.5" /> 연구 목록으로
      </Link>

      {/* Header */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: project.color ?? "#4f46e5" }}
              />
              <h1 className="text-lg font-bold text-slate-900">{project.title}</h1>
              <Badge tone={PROJECT_STATUS_TONES[project.status]}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            {project.description && (
              <p className="mt-2 text-sm text-slate-500">{project.description}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">
              {formatDateKo(project.startDate)} → {formatDateKo(project.targetDate)}
            </p>
            {project.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {project.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ProjectFormButton
              project={{
                id: project.id,
                title: project.title,
                description: project.description ?? "",
                status: project.status,
                color: project.color ?? "#4f46e5",
                startDate: toDateInput(project.startDate),
                targetDate: toDateInput(project.targetDate),
                tags: project.tags.join(", "),
              }}
            />
            <ConfirmButton
              message={`"${project.title}" 프로젝트와 모든 태스크/마일스톤을 삭제할까요?`}
              action={async () => {
                "use server";
                await deleteProject(project.id);
              }}
            />
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={progress} />
        </div>
      </Card>

      {/* Tasks + milestones */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>태스크</CardTitle>
          <TaskTable projectId={project.id} tasks={taskRows} />
        </Card>
        <Card>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Target className="size-4 text-primary-500" /> 마일스톤
            </span>
          </CardTitle>
          <MilestoneList projectId={project.id} milestones={milestoneRows} />
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardTitle
          action={
            <LogFormButton
              projects={[{ id: project.id, title: project.title }]}
              defaultProjectId={project.id}
              defaultDate={toDateInput(today)}
            />
          }
        >
          연구 기록
        </CardTitle>
        <LogList logs={project.logs} />
      </Card>
    </div>
  );
}
