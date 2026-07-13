"use client";

import { useState, useTransition } from "react";
import { Copy, Check, KeyRound, Plus } from "lucide-react";
import { createApiToken, revokeApiToken } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";

export type TokenRow = {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string;
};

export function TokenManager({ tokens }: { tokens: TokenRow[] }) {
  const [name, setName] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function issue() {
    startTransition(async () => {
      const token = await createApiToken(name || "sync token");
      setIssued(token);
      setName("");
      setCopied(false);
    });
  }

  async function copy() {
    if (!issued) return;
    await navigator.clipboard.writeText(issued);
    setCopied(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="토큰 이름 (예: 연구실 PC)"
          className="flex-1"
          maxLength={100}
        />
        <Button onClick={issue} disabled={pending}>
          <Plus className="size-4" /> 발급
        </Button>
      </div>

      {issued && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-700">
            아래 토큰은 지금 한 번만 표시됩니다. sync.config.json에 저장하세요.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-700 ring-1 ring-amber-200">
              {issued}
            </code>
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-slate-50">
        {tokens.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <KeyRound className="size-4 shrink-0 text-slate-300" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-700">{t.name}</p>
              <p className="text-[11px] text-slate-400">
                발급 {t.createdAt} · 마지막 사용 {t.lastUsedAt || "없음"}
              </p>
            </div>
            <ConfirmButton
              message={`"${t.name}" 토큰을 폐기할까요? 이 토큰을 쓰는 sync 스크립트는 동작을 멈춥니다.`}
              action={async () => revokeApiToken(t.id)}
              title="폐기"
            />
          </li>
        ))}
        {tokens.length === 0 && (
          <li className="py-3 text-center text-xs text-slate-400">발급된 토큰이 없습니다</li>
        )}
      </ul>
    </div>
  );
}
