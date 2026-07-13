"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { str, strOrNull, tags } from "@/lib/form";

export async function createLibraryItem(fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.libraryItem.create({
    data: {
      title,
      url: strOrNull(fd, "url"),
      snippet: strOrNull(fd, "snippet"),
      category: strOrNull(fd, "category"),
      tags: tags(fd, "tags"),
    },
  });
  revalidatePath("/library");
}

export async function updateLibraryItem(id: string, fd: FormData) {
  const title = str(fd, "title");
  if (!title) return;
  await db.libraryItem.update({
    where: { id },
    data: {
      title,
      url: strOrNull(fd, "url"),
      snippet: strOrNull(fd, "snippet"),
      category: strOrNull(fd, "category"),
      tags: tags(fd, "tags"),
    },
  });
  revalidatePath("/library");
}

export async function togglePin(id: string, pinned: boolean) {
  await db.libraryItem.update({ where: { id }, data: { pinned } });
  revalidatePath("/library");
}

export async function deleteLibraryItem(id: string) {
  await db.libraryItem.delete({ where: { id } });
  revalidatePath("/library");
}
