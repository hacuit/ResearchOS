"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateApiToken } from "@/lib/auth";

export async function createApiToken(name: string): Promise<string> {
  const cleaned = name.trim().slice(0, 100) || "sync token";
  const { token, hash } = generateApiToken();
  await db.apiToken.create({ data: { name: cleaned, tokenHash: hash } });
  revalidatePath("/settings");
  return token; // shown once in the UI, only the hash is stored
}

export async function revokeApiToken(id: string) {
  await db.apiToken.delete({ where: { id } });
  revalidatePath("/settings");
}
