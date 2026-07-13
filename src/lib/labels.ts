import type {
  ProjectStatus,
  TaskStatus,
  Priority,
  IdeaStatus,
  ReadingStatus,
  RecurrenceFreq,
} from "@prisma/client";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: "예정",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
  ON_HOLD: "보류",
  STOPPED: "중단",
  DISCARDED: "폐기",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "할 일",
  IN_PROGRESS: "진행중",
  DONE: "완료",
  ON_HOLD: "보류",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음",
  URGENT: "긴급",
};

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  EXPLORING: "탐색중",
  ON_HOLD: "보류",
  PROMOTED: "승격됨",
  DISCARDED: "폐기",
};

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  TO_READ: "읽을 예정",
  READING: "읽는 중",
  DONE: "완료",
  SKIMMED: "훑어봄",
};

export const RECURRENCE_LABELS: Record<RecurrenceFreq, string> = {
  NONE: "반복 없음",
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
};

// Badge tone per status — maps to Badge component tones
export const PROJECT_STATUS_TONES: Record<ProjectStatus, string> = {
  PLANNED: "slate",
  IN_PROGRESS: "indigo",
  COMPLETED: "green",
  ON_HOLD: "amber",
  STOPPED: "red",
  DISCARDED: "slate",
};

export const TASK_STATUS_TONES: Record<TaskStatus, string> = {
  TODO: "slate",
  IN_PROGRESS: "indigo",
  DONE: "green",
  ON_HOLD: "amber",
};

export const PRIORITY_TONES: Record<Priority, string> = {
  LOW: "slate",
  MEDIUM: "indigo",
  HIGH: "amber",
  URGENT: "red",
};

export const IDEA_STATUS_TONES: Record<IdeaStatus, string> = {
  EXPLORING: "indigo",
  ON_HOLD: "amber",
  PROMOTED: "green",
  DISCARDED: "slate",
};

export const READING_STATUS_TONES: Record<ReadingStatus, string> = {
  TO_READ: "slate",
  READING: "indigo",
  DONE: "green",
  SKIMMED: "violet",
};
