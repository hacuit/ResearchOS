"use server";

import { revalidatePath } from "next/cache";
import type { VenueType } from "@prisma/client";
import { db } from "@/lib/db";
import { str, strOrNull, dateOrNull } from "@/lib/form";

function revalidateVenues() {
  revalidatePath("/venues");
  revalidatePath("/");
}

function venueData(fd: FormData) {
  return {
    name: str(fd, "name"),
    fullName: strOrNull(fd, "fullName"),
    type: (str(fd, "type") === "JOURNAL" ? "JOURNAL" : "CONFERENCE") as VenueType,
    field: strOrNull(fd, "field"),
    siteUrl: strOrNull(fd, "siteUrl"),
    submitUrl: strOrNull(fd, "submitUrl"),
    color: strOrNull(fd, "color"),
    note: strOrNull(fd, "note"),
  };
}

export async function createVenue(fd: FormData) {
  const data = venueData(fd);
  if (!data.name) return;
  const max = await db.venue.aggregate({ _max: { sortOrder: true } });
  await db.venue.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
  revalidateVenues();
}

export async function updateVenue(id: string, fd: FormData) {
  const data = venueData(fd);
  if (!data.name) return;
  await db.venue.update({ where: { id }, data });
  revalidateVenues();
}

export async function deleteVenue(id: string) {
  await db.venue.delete({ where: { id } });
  revalidateVenues();
}

export async function createVenueDate(venueId: string, fd: FormData) {
  const kind = str(fd, "kind");
  const date = dateOrNull(fd, "date");
  if (!kind || !date) return;
  await db.venueDate.create({
    data: {
      venueId,
      kind,
      date,
      endDate: dateOrNull(fd, "endDate"),
      note: strOrNull(fd, "note"),
    },
  });
  revalidateVenues();
}

export async function deleteVenueDate(id: string) {
  await db.venueDate.delete({ where: { id } });
  revalidateVenues();
}
