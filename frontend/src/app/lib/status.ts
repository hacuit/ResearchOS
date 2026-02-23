export const STATUS_VALUES = ["planned", "in_progress", "completed", "on_hold", "stopped", "discarded"] as const;
export const DELIVERABLE_STATUS_VALUES = ["planned", "in_progress", "completed"] as const;

export const STATUS_OPTIONS = [
  { value: "planned", label: "예정" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "완료" },
  { value: "on_hold", label: "보류" },
  { value: "stopped", label: "중단" },
  { value: "discarded", label: "폐기" },
] as const;

export function statusClass(status: string): string {
  switch (status) {
    case "completed":
      return "chip done";
    case "in_progress":
      return "chip prog";
    case "planned":
      return "chip plan";
    case "on_hold":
      return "chip hold";
    case "stopped":
      return "chip stop";
    case "discarded":
      return "chip disc";
    default:
      return "chip";
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "planned":
      return "예정";
    case "in_progress":
      return "진행중";
    case "completed":
      return "완료";
    case "on_hold":
      return "보류";
    case "stopped":
      return "중단";
    case "discarded":
      return "폐기";
    default:
      return status;
  }
}
