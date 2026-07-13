"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { saveCondition } from "@/actions/routine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

type ConditionValues = {
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  note: string;
};

function ScaleRow({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "size-8 rounded-lg text-xs font-bold transition cursor-pointer",
              value === n
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 hover:bg-primary-100 hover:text-primary-600"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

export function ConditionEntry({
  date,
  initial,
}: {
  date: string;
  initial: ConditionValues;
}) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    startTransition(async () => {
      await saveCondition(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form action={submit} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <ScaleRow
        label="기분"
        name="mood"
        value={values.mood}
        onChange={(mood) => setValues((v) => ({ ...v, mood }))}
      />
      <ScaleRow
        label="에너지"
        name="energy"
        value={values.energy}
        onChange={(energy) => setValues((v) => ({ ...v, energy }))}
      />
      <ScaleRow
        label="수면의 질"
        name="sleepQuality"
        value={values.sleepQuality}
        onChange={(sleepQuality) => setValues((v) => ({ ...v, sleepQuality }))}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="w-20 shrink-0 text-xs font-semibold text-slate-600">수면 시간</span>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Input
            type="number"
            name="sleepHours"
            step={0.5}
            min={0}
            max={16}
            defaultValue={values.sleepHours ?? ""}
            className="w-24 text-right"
          />
          <span className="text-xs text-slate-400">시간</span>
        </div>
      </div>
      <Input name="note" placeholder="한 줄 메모 (선택)" defaultValue={values.note} maxLength={300} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="sm">
          {saved ? (
            <>
              <Check className="size-3.5" /> 저장됨
            </>
          ) : (
            "저장"
          )}
        </Button>
      </div>
    </form>
  );
}
