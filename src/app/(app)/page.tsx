import Link from "next/link";
import { format } from "date-fns";
import {
  AlarmClock,
  ArrowUpRight,
  CheckCircle2,
  FlaskConical,
  Receipt,
  Target,
  CalendarDays,
} from "lucide-react";
import { db } from "@/lib/db";
import { todayUtc, toDateInput, formatDateShort, formatWon } from "@/lib/dates";
import { projectProgress, isOverdue } from "@/lib/progress";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES, TASK_STATUS_LABELS } from "@/lib/labels";
import { Card, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Donut } from "@/components/charts/donut";
import { Bars } from "@/components/charts/bars";
import { TrendLine } from "@/components/charts/trend-line";
import { LogList } from "./research/_components/log-list";

export const dynamic = "force-dynamic";

function addDaysUtc(date: Date, offset: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

export default async function DashboardPage() {
  const today = todayUtc();
  const weekStart = addDaysUtc(today, -6);
  const twoWeeksStart = addDaysUtc(today, -13);
  const deadlineEnd = addDaysUtc(today, 14);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

  const [
    projects,
    doneTasksThisWeek,
    logs14,
    conditions,
    expensesThisMonth,
    upcomingTasks,
    upcomingMilestones,
    upcomingPlans,
    upcomingProposals,
    recentLogs,
    habitLogsThisWeek,
  ] = await Promise.all([
    db.project.findMany({
      include: { tasks: true, milestones: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.task.count({
      where: { status: "DONE", updatedAt: { gte: weekStart } },
    }),
    db.researchLog.findMany({
      where: { date: { gte: twoWeeksStart, lte: today } },
      select: { date: true },
    }),
    db.conditionLog.findMany({
      where: { date: { gte: twoWeeksStart, lte: today } },
      orderBy: { date: "asc" },
    }),
    db.expenseItem.aggregate({
      where: { date: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    db.task.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { not: null, lte: deadlineEnd },
      },
      include: { project: { select: { title: true, id: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.milestone.findMany({
      where: { done: false, dueDate: { lte: deadlineEnd } },
      include: { project: { select: { title: true, id: true } } },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    db.planItem.findMany({
      where: { done: false, date: { gte: today, lte: deadlineEnd } },
      orderBy: { date: "asc" },
      take: 10,
    }),
    db.proposalDoc.findMany({
      where: { status: "draft", deadline: { not: null, lte: deadlineEnd } },
      orderBy: { deadline: "asc" },
    }),
    db.researchLog.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    db.habitLog.count({ where: { date: { gte: weekStart, lte: today }, done: true } }),
  ]);

  // ----- stats -----
  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS");
  const allTasks = projects.flatMap((p) => p.tasks);
  const overdueCount =
    allTasks.filter((t) => isOverdue(t.dueDate, t.status === "DONE", today)).length +
    projects.flatMap((p) => p.milestones).filter((m) => isOverdue(m.dueDate, m.done, today)).length;
  const monthExpense = expensesThisMonth._sum.amount ?? 0;

  // ----- task status donut -----
  const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0, ON_HOLD: 0 };
  for (const t of allTasks) statusCounts[t.status]++;
  const donutData = [
    { name: TASK_STATUS_LABELS.IN_PROGRESS, value: statusCounts.IN_PROGRESS, color: "#4f46e5" },
    { name: TASK_STATUS_LABELS.TODO, value: statusCounts.TODO, color: "#c7d2fe" },
    { name: TASK_STATUS_LABELS.DONE, value: statusCounts.DONE, color: "#10b981" },
    { name: TASK_STATUS_LABELS.ON_HOLD, value: statusCounts.ON_HOLD, color: "#f59e0b" },
  ];

  // ----- 14-day activity bars -----
  const logCountByDay = new Map<string, number>();
  for (const log of logs14) {
    const key = toDateInput(log.date);
    logCountByDay.set(key, (logCountByDay.get(key) ?? 0) + 1);
  }
  const activityData = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysUtc(twoWeeksStart, i);
    return {
      label: format(d, "M.d"),
      기록: logCountByDay.get(toDateInput(d)) ?? 0,
    };
  });

  // ----- condition trend (14d) -----
  const condByDay = new Map(conditions.map((c) => [toDateInput(c.date), c]));
  const conditionData = Array.from({ length: 14 }, (_, i) => {
    const d = addDaysUtc(twoWeeksStart, i);
    const c = condByDay.get(toDateInput(d));
    return {
      label: format(d, "M.d"),
      기분: c?.mood ?? null,
      에너지: c?.energy ?? null,
    };
  });

  // ----- unified deadline list -----
  type Deadline = {
    id: string;
    date: Date;
    title: string;
    context: string;
    href: string;
    kind: string;
    overdue: boolean;
  };
  const deadlines: Deadline[] = [
    ...upcomingTasks.map((t) => ({
      id: `t-${t.id}`,
      date: t.dueDate!,
      title: t.title,
      context: t.project.title,
      href: `/research/${t.project.id}`,
      kind: "태스크",
      overdue: t.dueDate! < today,
    })),
    ...upcomingMilestones.map((m) => ({
      id: `m-${m.id}`,
      date: m.dueDate,
      title: m.title,
      context: m.project.title,
      href: `/research/${m.project.id}`,
      kind: "마일스톤",
      overdue: m.dueDate < today,
    })),
    ...upcomingPlans.map((p) => ({
      id: `p-${p.id}`,
      date: p.date,
      title: p.title,
      context: "플래너",
      href: `/planner?view=week&date=${toDateInput(p.date)}`,
      kind: p.kind === "EVENT" ? "일정" : "할 일",
      overdue: false,
    })),
    ...upcomingProposals.map((p) => ({
      id: `pr-${p.id}`,
      date: p.deadline!,
      title: p.title,
      context: p.agency ?? "제안서",
      href: "/docs?tab=proposals",
      kind: "제안서",
      overdue: p.deadline! < today,
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 9);

  const projectTitles = new Map(projects.map((p) => [p.id, p.title]));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="진행중 프로젝트"
          value={activeProjects.length}
          sub={`전체 ${projects.length}개`}
          icon={FlaskConical}
          tint="indigo"
        />
        <StatCard
          label="이번 주 완료 태스크"
          value={doneTasksThisWeek}
          sub={`루틴 체크 ${habitLogsThisWeek}회`}
          icon={CheckCircle2}
          tint="green"
        />
        <StatCard
          label="지연 항목"
          value={overdueCount}
          sub="태스크 + 마일스톤"
          icon={AlarmClock}
          tint={overdueCount > 0 ? "red" : "slate"}
        />
        <StatCard
          label="이번 달 연구비"
          value={formatWon(monthExpense)}
          sub={format(today, "yyyy년 M월")}
          icon={Receipt}
          tint="violet"
        />
      </div>

      {/* Progress + donut + condition */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle
            action={
              <Link href="/research" className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:underline">
                전체 보기 <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            프로젝트 진행률
          </CardTitle>
          <div className="space-y-4">
            {projects
              .filter((p) => !["DISCARDED", "STOPPED", "COMPLETED"].includes(p.status))
              .slice(0, 5)
              .map((p) => (
                <Link key={p.id} href={`/research/${p.id}`} className="block">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-700 hover:text-primary-700">
                      {p.title}
                    </p>
                    <Badge tone={PROJECT_STATUS_TONES[p.status]}>
                      {PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                  <ProgressBar value={projectProgress(p.tasks, p.milestones)} />
                </Link>
              ))}
            {projects.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">프로젝트가 없습니다</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>태스크 상태</CardTitle>
          <Donut
            data={donutData}
            centerValue={`${allTasks.length}`}
            centerLabel="전체 태스크"
          />
        </Card>

        <Card>
          <CardTitle
            action={
              <Link href="/routine" className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:underline">
                루틴 <ArrowUpRight className="size-3" />
              </Link>
            }
          >
            컨디션 추이
          </CardTitle>
          <TrendLine
            data={conditionData}
            series={[
              { key: "기분", label: "기분", color: "#4f46e5" },
              { key: "에너지", label: "에너지", color: "#8b5cf6" },
            ]}
            height={210}
            yDomain={[1, 5]}
          />
        </Card>
      </div>

      {/* Activity + deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>연구 기록 활동 (14일)</CardTitle>
          <Bars
            data={activityData}
            series={[{ key: "기록", label: "연구 기록", color: "#4f46e5" }]}
            height={230}
          />
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Target className="size-4 text-red-400" /> 다가오는 마감 (14일)
            </span>
          </CardTitle>
          <ul className="space-y-2.5">
            {deadlines.map((d) => (
              <li key={d.id}>
                <Link href={d.href} className="group flex items-center gap-2.5">
                  <span
                    className={`w-10 shrink-0 text-center text-[11px] font-bold tabular-nums ${
                      d.overdue ? "text-red-500" : "text-slate-500"
                    }`}
                  >
                    {formatDateShort(d.date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-700 group-hover:text-primary-700">
                      {d.title}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{d.context}</p>
                  </div>
                  <Badge tone={d.overdue ? "red" : "slate"}>{d.kind}</Badge>
                </Link>
              </li>
            ))}
            {deadlines.length === 0 && (
              <li className="flex flex-col items-center gap-1 py-8 text-center">
                <CalendarDays className="size-6 text-slate-200" />
                <p className="text-xs text-slate-400">2주 내 마감이 없습니다</p>
              </li>
            )}
          </ul>
        </Card>
      </div>

      {/* Recent logs */}
      <Card>
        <CardTitle
          action={
            <Link href="/research" className="flex items-center gap-0.5 text-xs font-semibold text-primary-600 hover:underline">
              전체 기록 <ArrowUpRight className="size-3" />
            </Link>
          }
        >
          최근 연구 기록
        </CardTitle>
        <LogList logs={recentLogs} projectTitles={projectTitles} />
      </Card>
    </div>
  );
}
