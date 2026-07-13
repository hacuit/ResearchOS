"use server";

import { revalidatePath } from "next/cache";
import type { ReadingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { str, strOrNull, tags, intOrNull } from "@/lib/form";

const STATUSES: ReadingStatus[] = ["TO_READ", "READING", "DONE", "SKIMMED"];

function asStatus(v: string): ReadingStatus {
  return STATUSES.includes(v as ReadingStatus) ? (v as ReadingStatus) : "TO_READ";
}

function paperData(fd: FormData) {
  const rating = intOrNull(fd, "rating");
  return {
    title: str(fd, "title"),
    authors: strOrNull(fd, "authors"),
    venue: strOrNull(fd, "venue"),
    year: intOrNull(fd, "year"),
    url: strOrNull(fd, "url"),
    doi: strOrNull(fd, "doi"),
    status: asStatus(str(fd, "status")),
    rating: rating === null ? null : Math.max(1, Math.min(5, rating)),
    tags: tags(fd, "tags"),
    category: strOrNull(fd, "category"),
    summaryMd: strOrNull(fd, "summaryMd"),
    notes: strOrNull(fd, "notes"),
  };
}

export async function createPaper(fd: FormData) {
  const data = paperData(fd);
  if (!data.title) return;
  await db.paper.create({ data });
  revalidatePath("/papers");
}

export async function updatePaper(id: string, fd: FormData) {
  const data = paperData(fd);
  if (!data.title) return;
  await db.paper.update({ where: { id }, data });
  revalidatePath("/papers");
}

export async function patchPaperStatus(id: string, status: string) {
  await db.paper.update({ where: { id }, data: { status: asStatus(status) } });
  revalidatePath("/papers");
}

export async function deletePaper(id: string) {
  await db.paper.delete({ where: { id } });
  revalidatePath("/papers");
}
