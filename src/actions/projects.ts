"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProjectStatus, TaskStatus, Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { str, strOrNull, dateOrNull, tags, intOr, clampPct } from "@/lib/form";

const PROJECT_STATUSES: ProjectStatus[] = [
  "PLANNED", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "STOPPED", "DISCARDED",
];
const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE", "ON_HOLD"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function asProjectStatus(v: string): ProjectStatus {
  return PROJECT_STATUSES.includes(v as ProjectStatus) ? (v as ProjectStatus) : "PLANNED";
}
function asTaskStatus(v: string): TaskStatus {
  return TASK_STATUSES.includes(v as TaskStatus) ? (v as TaskStatus) : "TODO";
}
function asPriority(v: string): Priority {
  return PRIORITIES.includes(v as Priority) ? (v as Priority) : "MEDIUM";
}

function revalidateResearch(projectId?: string) {
  revalidatePath("/research");
  revalidatePath("/");
  if (projectId) revalidatePath(`/research/${projectId}`);
}

// ---------- Projects ----------

export async function createProject(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const max = await db.project.aggregate({ _max: { sortOrder: true } });
  const project = await db.project.create({
    data: {
      title,
      description: strOrNull(fd, "description"),
      status: asProjectStatus(str(fd, "status")),
      color: strOrNull(fd, "color"),
      startDate: dateOrNull(fd, "startDate"),
      targetDate: dateOrNull(fd, "targetDate"),
      tags: tags(fd, "tags"),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  revalidateResearch();
  redirect(`/research/${project.id}`);
}

export async function updateProject(id: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.project.update({
    where: { id },
    data: {
      title,
      description: strOrNull(fd, "description"),
      status: asProjectStatus(str(fd, "status")),
      color: strOrNull(fd, "color"),
      startDate: dateOrNull(fd, "startDate"),
      targetDate: dateOrNull(fd, "targetDate"),
      tags: tags(fd, "tags"),
    },
  });
  revalidateResearch(id);
}

export async function deleteProject(id: string) {
  await db.project.delete({ where: { id } });
  revalidateResearch();
  redirect("/research");
}

// ---------- Tasks ----------

export async function createTask(projectId: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const max = await db.task.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  });
  await db.task.create({
    data: {
      projectId,
      title,
      status: asTaskStatus(str(fd, "status")),
      priority: asPriority(str(fd, "priority")),
      progress: clampPct(intOr(fd, "progress", 0)),
      startDate: dateOrNull(fd, "startDate"),
      dueDate: dateOrNull(fd, "dueDate"),
      notes: strOrNull(fd, "notes"),
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  revalidateResearch(projectId);
}

export async function updateTask(id: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  const task = await db.task.update({
    where: { id },
    data: {
      title,
      status: asTaskStatus(str(fd, "status")),
      priority: asPriority(str(fd, "priority")),
      progress: clampPct(intOr(fd, "progress", 0)),
      startDate: dateOrNull(fd, "startDate"),
      dueDate: dateOrNull(fd, "dueDate"),
      notes: strOrNull(fd, "notes"),
    },
  });
  revalidateResearch(task.projectId);
}

/** Quick inline updates from the task table (status select / progress). */
export async function patchTask(
  id: string,
  patch: { status?: string; progress?: number; priority?: string }
) {
  const task = await db.task.update({
    where: { id },
    data: {
      ...(patch.status !== undefined && { status: asTaskStatus(patch.status) }),
      ...(patch.priority !== undefined && { priority: asPriority(patch.priority) }),
      ...(patch.progress !== undefined && {
        progress: clampPct(patch.progress),
      }),
      ...(patch.status === "DONE" && { progress: 100 }),
    },
  });
  revalidateResearch(task.projectId);
}

export async function deleteTask(id: string) {
  const task = await db.task.delete({ where: { id } });
  revalidateResearch(task.projectId);
}

// ---------- Milestones ----------

export async function createMilestone(projectId: string, fd: FormData) {
  const title = str(fd, "title");
  const dueDate = dateOrNull(fd, "dueDate");
  if (!title || !dueDate) return;
  await db.milestone.create({
    data: {
      projectId,
      title,
      kind: strOrNull(fd, "kind"),
      dueDate,
      link: strOrNull(fd, "link"),
    },
  });
  revalidateResearch(projectId);
}

export async function toggleMilestone(id: string, done: boolean) {
  const ms = await db.milestone.update({ where: { id }, data: { done } });
  revalidateResearch(ms.projectId);
}

export async function deleteMilestone(id: string) {
  const ms = await db.milestone.delete({ where: { id } });
  revalidateResearch(ms.projectId);
}

// ---------- Research logs ----------

export async function createLog(fd: FormData) {
  const title = str(fd, "title");
  const date = dateOrNull(fd, "date");
  if (!title || !date) return;
  const projectId = strOrNull(fd, "projectId");
  await db.researchLog.create({
    data: {
      projectId,
      date,
      title,
      bodyMd: str(fd, "bodyMd"),
      source: "manual",
    },
  });
  revalidateResearch(projectId ?? undefined);
}

export async function deleteLog(id: string) {
  const log = await db.researchLog.delete({ where: { id } });
  revalidateResearch(log.projectId ?? undefined);
}
