"use client";

import { useState, useTransition } from "react";
import { Flame, Pencil, Plus } from "lucide-react";
import { createHabit, updateHabit, deleteHabit, toggleHabitLog } from "@/actions/routine";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { cn } from "@/lib/cn";

export type HabitRowData = {
  id: string;
  name: string;
  icon: string;
  color: string;
  daysOfWeek: number[];
  active: boolean;
  streak: number;
  /** aligned with the `days` prop: done flag per day */
  doneByDay: boolean[];
};

const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export const HABIT_COLORS = [
  "#93c5fd", // blue
  "#c4b5fd", // violet
  "#fdba74", // orange
  "#fca5a5", // red
  "#86efac", // green
  "#5eead4", // teal
  "#f9a8d4", // pink
  "#fde047", // yellow
];

function HabitFormDialog({
  open,
  onClose,
  habit,
}: {
  open: boolean;
  onClose: () => void;
  habit?: HabitRowData;
}) {
  async function handleAction(fd: FormData) {
    if (habit) await updateHabit(habit.id, fd);
    else await createHabit(fd);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={habit ? "루틴 편집" : "새 루틴"}>
      <form action={handleAction} className="space-y-4">
        <div className="grid grid-cols-[4.5rem_1fr] gap-3">
          <Field label="이모지">
            <Input name="icon" defaultValue={habit?.icon} placeholder="📖" maxLength={4} className="text-center" />
          </Field>
          <Field label="이름" required>
            <Input name="name" defaultValue={habit?.name} required maxLength={100} />
          </Field>
        </div>
        <Field label="색상">
          <div className="flex flex-wrap gap-2">
            {HABIT_COLORS.map((c) => (
              <label key={c} className="cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c}
                  defaultChecked={habit ? habit.color === c : c === HABIT_COLORS[0]}
                  className="peer sr-only"
                />
                <span
                  className="block size-8 rounded-lg ring-2 ring-transparent ring-offset-2 transition peer-checked:ring-slate-400"
                  style={{ backgroundColor: c }}
                />
              </label>
            ))}
          </div>
        </Field>
        <Field label="요일 (미선택 시 매일)">
          <div className="flex gap-1.5">
            {DOW_LABELS.map((label, dow) => (
              <label
                key={dow}
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500 transition has-checked:bg-primary-600 has-checked:text-white"
              >
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={dow}
                  defaultChecked={habit?.daysOfWeek.includes(dow)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </Field>
        {habit && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              name="active"
              defaultChecked={habit.active}
              className="size-4 accent-indigo-600"
            />
            활성 상태
          </label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
          <Button type="submit">{habit ? "저장" : "추가"}</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function HabitTracker({
  habits,
  days,
}: {
  habits: HabitRowData[];
  /** last 7 days, each { date: 'yyyy-MM-dd', dow: 0-6, label: 'M.d', isToday } */
  days: { date: string; dow: number; label: string; isToday: boolean }[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HabitRowData | undefined>();
  const [, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">최근 7일</p>
        <Button size="sm" variant="secondary" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
          <Plus className="size-3.5" /> 루틴 추가
        </Button>
      </div>

      <div className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="text-[11px] text-slate-400">
              <th className="pb-2 text-left font-semibold">루틴</th>
              {days.map((d) => (
                <th
                  key={d.date}
                  className={cn(
                    "pb-2 text-center font-semibold",
                    d.isToday && "text-primary-600"
                  )}
                >
                  <span className="block">{DOW_LABELS[d.dow]}</span>
                  <span className="block font-normal">{d.label}</span>
                </th>
              ))}
              <th className="pb-2 text-center font-semibold">
                <Flame className="mx-auto size-3.5 text-amber-400" />
              </th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id} className="group border-t border-slate-50">
                <td className="max-w-44 py-2 pr-2">
                  <p className={cn("truncate text-xs font-semibold", habit.active ? "text-slate-700" : "text-slate-300")}>
                    {habit.icon && <span className="mr-1">{habit.icon}</span>}
                    {habit.name}
                  </p>
                  {habit.daysOfWeek.length > 0 && (
                    <p className="text-[10px] text-slate-300">
                      {habit.daysOfWeek.map((d) => DOW_LABELS[d]).join(" ")}
                    </p>
                  )}
                </td>
                {days.map((d, i) => {
                  const scheduled =
                    habit.daysOfWeek.length === 0 || habit.daysOfWeek.includes(d.dow);
                  const done = habit.doneByDay[i];
                  return (
                    <td key={d.date} className="py-2 text-center">
                      <button
                        type="button"
                        disabled={!scheduled || !habit.active}
                        onClick={() =>
                          startTransition(async () =>
                            toggleHabitLog(habit.id, d.date, !done)
                          )
                        }
                        className={cn(
                          "size-7 rounded-lg text-xs font-bold transition",
                          !scheduled || !habit.active
                            ? "cursor-default bg-slate-50 text-slate-200"
                            : done
                              ? "cursor-pointer text-white/90 hover:opacity-80"
                              : "cursor-pointer bg-slate-100 text-slate-300 hover:bg-slate-200"
                        )}
                        style={done && scheduled && habit.active ? { backgroundColor: habit.color } : undefined}
                        aria-label={`${habit.name} ${d.date}`}
                      >
                        {done ? "✓" : scheduled ? "·" : ""}
                      </button>
                    </td>
                  );
                })}
                <td className="py-2 text-center">
                  <span className="text-xs font-bold tabular-nums text-amber-500">
                    {habit.streak}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <div className="flex items-center justify-end opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => { setEditing(habit); setFormOpen(true); }}
                      className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                      title="편집"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <ConfirmButton
                      message={`"${habit.name}" 루틴과 기록을 모두 삭제할까요?`}
                      action={async () => deleteHabit(habit.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {habits.length === 0 && (
              <tr>
                <td colSpan={days.length + 3} className="py-8 text-center text-xs text-slate-400">
                  루틴이 없습니다. 첫 루틴을 추가해보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <HabitFormDialog open={formOpen} onClose={() => setFormOpen(false)} habit={editing} />
    </div>
  );
}
