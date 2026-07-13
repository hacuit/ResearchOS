import type { ResearchLog } from "@prisma/client";
import { FileText } from "lucide-react";
import { deleteLog } from "@/actions/projects";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState } from "@/components/ui/empty-state";
import { renderMarkdown } from "@/lib/markdown";
import { formatDateKo } from "@/lib/dates";

export function LogList({
  logs,
  projectTitles,
}: {
  logs: ResearchLog[];
  projectTitles?: Map<string, string>;
}) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="연구 기록이 없습니다"
        description="수동으로 기록을 추가하거나 sync 스크립트로 일일보고서를 업로드하세요."
      />
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <details
          key={log.id}
          className="group rounded-xl border border-slate-100 open:border-primary-100 open:bg-primary-50/30"
        >
          <summary className="flex cursor-pointer items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{log.title}</p>
              <p className="text-[11px] text-slate-400">
                {formatDateKo(log.date)}
                {projectTitles && log.projectId && projectTitles.get(log.projectId) && (
                  <span className="ml-2 text-primary-500">
                    {projectTitles.get(log.projectId)}
                  </span>
                )}
              </p>
            </div>
            <Badge tone={log.source === "sync" ? "violet" : "indigo"}>
              {log.source === "sync" ? "동기화" : "수동"}
            </Badge>
            <ConfirmButton
              message={`"${log.title}" 기록을 삭제할까요?`}
              action={async () => {
                "use server";
                await deleteLog(log.id);
              }}
            />
          </summary>
          <div
            className="md-body border-t border-slate-100 px-4 py-3"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(log.bodyMd) }}
          />
        </details>
      ))}
    </div>
  );
}
