"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { IdeaStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { str, strOrNull, tags } from "@/lib/form";

const STATUSES: IdeaStatus[] = ["EXPLORING", "ON_HOLD", "PROMOTED", "DISCARDED"];

function asStatus(v: string): IdeaStatus {
  return STATUSES.includes(v as IdeaStatus) ? (v as IdeaStatus) : "EXPLORING";
}

export async function createIdea(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.idea.create({
    data: {
      title,
      body: strOrNull(fd, "body"),
      status: asStatus(str(fd, "status")),
      tags: tags(fd, "tags"),
    },
  });
  revalidatePath("/ideas");
}

export async function updateIdea(id: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.idea.update({
    where: { id },
    data: {
      title,
      body: strOrNull(fd, "body"),
      status: asStatus(str(fd, "status")),
      tags: tags(fd, "tags"),
    },
  });
  revalidatePath("/ideas");
}

export async function patchIdeaStatus(id: string, status: string) {
  await db.idea.update({ where: { id }, data: { status: asStatus(status) } });
  revalidatePath("/ideas");
}

export async function deleteIdea(id: string) {
  await db.idea.delete({ where: { id } });
  revalidatePath("/ideas");
}

/** Promote an idea into a research project and jump to it. */
export async function promoteIdea(id: string) {
  const idea = await db.idea.findUnique({ where: { id } });
  if (!idea) return;
  const max = await db.project.aggregate({ _max: { sortOrder: true } });
  const project = await db.project.create({
    data: {
      title: idea.title,
      description: idea.body,
      status: "PLANNED",
      tags: idea.tags,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  });
  await db.idea.update({
    where: { id },
    data: { status: "PROMOTED", promotedProjectId: project.id },
  });
  revalidatePath("/ideas");
  revalidatePath("/research");
  redirect(`/research/${project.id}`);
}
