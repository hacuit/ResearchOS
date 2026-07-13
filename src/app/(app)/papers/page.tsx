import type { Prisma, ReadingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { PaperList, type PaperData } from "./_components/paper-list";

export const metadata = { title: "논문" };
export const dynamic = "force-dynamic";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const { q, status, category } = await searchParams;

  const where: Prisma.PaperWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { authors: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status as ReadingStatus;
  if (category) where.category = category;

  const [papers, totalCount, categoryRows] = await Promise.all([
    db.paper.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    }),
    db.paper.count(),
    db.paper.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const data: PaperData[] = papers.map((p) => ({
    id: p.id,
    title: p.title,
    authors: p.authors ?? "",
    venue: p.venue ?? "",
    year: p.year,
    url: p.url ?? "",
    doi: p.doi ?? "",
    status: p.status,
    rating: p.rating,
    tags: p.tags,
    category: p.category ?? "",
    summaryMd: p.summaryMd ?? "",
    summaryHtml: p.summaryMd ? renderMarkdown(p.summaryMd) : "",
    notes: p.notes ?? "",
  }));

  const categories = categoryRows
    .map((r) => r.category)
    .filter((c): c is string => !!c)
    .sort();

  return <PaperList papers={data} categories={categories} totalCount={totalCount} />;
}
