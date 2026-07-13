import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LibraryList, type LibraryData } from "./_components/library-list";

export const metadata = { title: "라이브러리" };
export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const where: Prisma.LibraryItemWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { snippet: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ];
  }
  if (category) where.category = category;

  const [items, categoryRows] = await Promise.all([
    db.libraryItem.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    }),
    db.libraryItem.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const data: LibraryData[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    url: i.url ?? "",
    snippet: i.snippet ?? "",
    category: i.category ?? "",
    tags: i.tags,
    pinned: i.pinned,
  }));

  const categories = categoryRows
    .map((r) => r.category)
    .filter((c): c is string => !!c)
    .sort();

  return <LibraryList items={data} categories={categories} />;
}
