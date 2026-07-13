import { Download, FolderSync, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardTitle } from "@/components/ui/card";
import { TokenManager, type TokenRow } from "./_components/token-manager";

export const metadata = { title: "설정" };
export const dynamic = "force-dynamic";

function fmt(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
}

export default async function SettingsPage() {
  const tokens = await db.apiToken.findMany({ orderBy: { createdAt: "desc" } });
  const rows: TokenRow[] = tokens.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: fmt(t.createdAt),
    lastUsedAt: fmt(t.lastUsedAt),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>
          <span className="flex items-center gap-1.5">
            <FolderSync className="size-4 text-primary-500" /> 로컬 PC 동기화 토큰
          </span>
        </CardTitle>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          로컬 PC의 일일보고서 폴더를 업로드하는 <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">scripts/sync-reports.mjs</code>가
          사용할 API 토큰입니다. 토큰은 해시로만 저장되며 발급 시 한 번만 표시됩니다.
        </p>
        <TokenManager tokens={rows} />
      </Card>

      <div className="space-y-6">
        <Card>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <FolderSync className="size-4 text-accent-500" /> 동기화 사용법
            </span>
          </CardTitle>
          <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600">
            <li>왼쪽에서 토큰을 발급하고 복사합니다.</li>
            <li>
              로컬 PC의 저장소에서 <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">scripts/sync.config.json</code>을
              만들고 <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">reportsDir</code>,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">apiUrl</code>,{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">apiToken</code>을 채웁니다.
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">node scripts/sync-reports.mjs</code>를
              실행하면 <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">Daily_Report_YYYY-MM-DD.md</code> 파일이
              연구 기록으로 업로드됩니다.
            </li>
            <li>Windows 작업 스케줄러에 등록하면 자동 동기화됩니다. (README 참고)</li>
          </ol>
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <Download className="size-4 text-emerald-500" /> 데이터 내보내기
            </span>
          </CardTitle>
          <p className="mb-3 text-xs text-slate-500">
            모든 데이터를 JSON 파일 하나로 내려받습니다. 주기적으로 백업해 두세요.
          </p>
          <a
            href="/api/export"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-300 hover:text-primary-700"
          >
            <Download className="size-4" /> JSON 내보내기
          </a>
        </Card>

        <Card>
          <CardTitle>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary-500" /> 계정
            </span>
          </CardTitle>
          <p className="text-xs leading-relaxed text-slate-500">
            단일 사용자 모드로 동작합니다. 로그인 비밀번호는 서버 환경변수{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">OWNER_PASSWORD</code>로
            관리되며, 변경 후 재배포하면 적용됩니다. 세션은 30일간 유지됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
