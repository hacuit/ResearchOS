"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Printer, RefreshCw } from "lucide-react";
import {
  createExpense,
  updateExpense,
  toggleReceipt,
  deleteExpense,
  applyRecurring,
  createRecurring,
  toggleRecurring,
  deleteRecurring,
} from "@/actions/docs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/cn";

export type ExpenseRow = {
  id: string;
  date: string;
  item: string;
  amount: number;
  category: string;
  vendor: string;
  note: string;
  receiptFiled: boolean;
  isRecurring: boolean;
};

export type RecurringRow = {
  id: string;
  item: string;
  amount: number;
  category: string;
  vendor: string;
  dayOfMonth: number;
  active: boolean;
};

function won(n: number): string {
  return n.toLocaleString("ko-KR");
}

function ExpenseFormDialog({
  open,
  onClose,
  expense,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseRow;
  defaultDate: string;
}) {
  async function handleAction(fd: FormData) {
    if (expense) await updateExpense(expense.id, fd);
    else await createExpense(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={expense ? "지출 편집" : "지출 추가"}>
      <form action={handleAction} className="space-y-4">
        <Field label="항목" required>
          <Input name="item" defaultValue={expense?.item} required maxLength={200} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="날짜" required>
            <Input type="date" name="date" defaultValue={expense?.date ?? defaultDate} required />
          </Field>
          <Field label="금액 (원)" required>
            <Input type="number" name="amount" defaultValue={expense?.amount ?? ""} required min={0} />
          </Field>
          <Field label="분류">
            <Input name="category" defaultValue={expense?.category} placeholder="SW 구독 / 장비 / 학회..." />
          </Field>
          <Field label="거래처">
            <Input name="vendor" defaultValue={expense?.vendor} />
          </Field>
        </div>
        <Field label="비고">
          <Input name="note" defaultValue={expense?.note} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="receiptFiled"
            defaultChecked={expense?.receiptFiled}
            className="size-4 accent-indigo-600"
          />
          영수증 제출 완료
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{expense ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

function RecurringManager({ recurring }: { recurring: RecurringRow[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleCreate(fd: FormData) {
    await createRecurring(fd);
  }

  return (
    <details className="rounded-2xl border border-slate-200/80 bg-white no-print">
      <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
        고정 지출 관리
        <span className="ml-2 text-xs font-normal text-slate-400">
          매월 반복되는 항목 (Claude Code 구독 등) · {recurring.filter((r) => r.active).length}개 활성
        </span>
      </summary>
      <div className="border-t border-slate-100 px-5 py-4">
        <ul className="mb-4 divide-y divide-slate-50">
          {recurring.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={r.active}
                onChange={(e) => {
                  const active = e.target.checked;
                  startTransition(async () => toggleRecurring(r.id, active));
                }}
                className="size-4 cursor-pointer accent-indigo-600"
                title="활성/비활성"
              />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", r.active ? "text-slate-700" : "text-slate-300 line-through")}>
                  {r.item}
                </p>
                <p className="text-[11px] text-slate-400">
                  매월 {r.dayOfMonth}일 · {won(r.amount)}원
                  {r.category && ` · ${r.category}`}
                  {r.vendor && ` · ${r.vendor}`}
                </p>
              </div>
              <ConfirmButton
                message={`"${r.item}" 고정 지출을 삭제할까요? (이미 생성된 지출 기록은 유지됩니다)`}
                action={async () => deleteRecurring(r.id)}
              />
            </li>
          ))}
          {recurring.length === 0 && (
            <li className="py-3 text-center text-xs text-slate-400">고정 지출이 없습니다</li>
          )}
        </ul>

        {open ? (
          <form
            action={async (fd) => {
              await handleCreate(fd);
              setOpen(false);
            }}
            className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-5"
          >
            <Input name="item" placeholder="항목명 *" required className="col-span-2 bg-white" />
            <Input type="number" name="amount" placeholder="금액" required min={0} className="bg-white" />
            <Input type="number" name="dayOfMonth" placeholder="결제일" min={1} max={31} defaultValue={1} className="bg-white" />
            <Input name="category" placeholder="분류" className="bg-white" />
            <div className="col-span-2 flex gap-2 sm:col-span-5">
              <Button type="submit" size="sm">추가</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>취소</Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> 고정 지출 추가
          </Button>
        )}
      </div>
    </details>
  );
}

export function ExpenseSection({
  expenses,
  recurring,
  year,
  month,
  monthLabel,
}: {
  expenses: ExpenseRow[];
  recurring: RecurringRow[];
  year: number;
  month: number;
  monthLabel: string;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseRow | undefined>();
  const [pending, startTransition] = useTransition();

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const filedCount = expenses.filter((e) => e.receiptFiled).length;
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const key = e.category || "기타";
    byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount);
  }
  const defaultDate = `${year}-${String(month).padStart(2, "0")}-01`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await applyRecurring(year, month);
              })
            }
            title="이번 달 고정 지출을 표에 추가"
          >
            <RefreshCw className={cn("size-3.5", pending && "animate-spin")} /> 고정지출 반영
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" /> 인쇄
          </Button>
        </div>
        <Button size="sm" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-3.5" /> 지출 추가
        </Button>
      </div>

      {/* Printable ledger */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{monthLabel} 연구비 지출 내역</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {expenses.length}건 · 영수증 제출 {filedCount}/{expenses.length}
            </p>
          </div>
          <p className="text-lg font-bold text-primary-700">{won(total)}원</p>
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-140 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-3 font-semibold">날짜</th>
                <th className="pb-2 pr-3 font-semibold">항목</th>
                <th className="pb-2 pr-3 font-semibold">분류</th>
                <th className="pb-2 pr-3 font-semibold">거래처</th>
                <th className="pb-2 pr-3 text-right font-semibold">금액(원)</th>
                <th className="pb-2 pr-3 text-center font-semibold">영수증</th>
                <th className="pb-2 font-semibold no-print" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="group border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pr-3 text-xs tabular-nums text-slate-500">{e.date}</td>
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-slate-800">
                      {e.item}
                      {e.isRecurring && (
                        <span className="ml-1.5 rounded bg-accent-100 px-1 py-px text-[10px] font-semibold text-accent-700">
                          고정
                        </span>
                      )}
                    </p>
                    {e.note && <p className="text-[11px] text-slate-400">{e.note}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-500">{e.category || "-"}</td>
                  <td className="py-2.5 pr-3 text-xs text-slate-500">{e.vendor || "-"}</td>
                  <td className="py-2.5 pr-3 text-right font-semibold tabular-nums text-slate-700">
                    {won(e.amount)}
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={e.receiptFiled}
                      onChange={(ev) => {
                        const filed = ev.target.checked;
                        startTransition(async () => toggleReceipt(e.id, filed));
                      }}
                      className="size-4 cursor-pointer accent-indigo-600"
                      title="영수증 제출 여부"
                    />
                  </td>
                  <td className="py-2.5 text-right no-print">
                    <div className="flex items-center justify-end opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => { setEditing(e); setFormOpen(true); }}
                        className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                        title="편집"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <ConfirmButton
                        message={`"${e.item}" 지출을 삭제할까요?`}
                        action={async () => deleteExpense(e.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                    이번 달 지출 내역이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
            {expenses.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={4} className="py-2.5 pr-3 text-right text-xs font-bold text-slate-500">
                    합계
                  </td>
                  <td className="py-2.5 pr-3 text-right text-sm font-bold tabular-nums text-primary-700">
                    {won(total)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {byCategory.size > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {[...byCategory.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => (
                <span
                  key={cat}
                  className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500"
                >
                  {cat} <b className="text-slate-700">{won(amount)}원</b>
                </span>
              ))}
          </div>
        )}
      </div>

      <RecurringManager recurring={recurring} />

      <ExpenseFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expense={editing}
        defaultDate={defaultDate}
      />
    </div>
  );
}
