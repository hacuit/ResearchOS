import { db } from "@/lib/db";
import { IdeaBoard, type IdeaData } from "./_components/idea-board";

export const metadata = { title: "아이디어" };
export const dynamic = "force-dynamic";

export default async function IdeasPage() {
  const ideas = await db.idea.findMany({ orderBy: { createdAt: "desc" } });

  const data: IdeaData[] = ideas.map((i) => ({
    id: i.id,
    title: i.title,
    body: i.body ?? "",
    status: i.status,
    tags: i.tags,
    promotedProjectId: i.promotedProjectId ?? "",
    createdAt: i.createdAt.toISOString().slice(0, 10),
  }));

  return <IdeaBoard ideas={data} />;
}
