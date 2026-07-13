import type { Task, Milestone } from "@prisma/client";

/**
 * Derived project progress: 0.7 * task completion + 0.3 * milestone completion.
 * Falls back to task-only (or milestone-only) when one side is empty.
 */
export function projectProgress(tasks: Task[], milestones: Milestone[]): number {
  const taskRatio = tasks.length
    ? tasks.reduce((sum, t) => sum + (t.status === "DONE" ? 100 : t.progress), 0) /
      (tasks.length * 100)
    : null;
  const msRatio = milestones.length
    ? milestones.filter((m) => m.done).length / milestones.length
    : null;

  if (taskRatio === null && msRatio === null) return 0;
  if (taskRatio === null) return Math.round(msRatio! * 100);
  if (msRatio === null) return Math.round(taskRatio * 100);
  return Math.round((0.7 * taskRatio + 0.3 * msRatio) * 100);
}

export function isOverdue(dueDate: Date | null, doneLike: boolean, today: Date): boolean {
  return !!dueDate && !doneLike && dueDate < today;
}
