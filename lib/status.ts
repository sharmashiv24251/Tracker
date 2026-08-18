export const STATUSES = ["todo", "in_progress", "done", "on_hold"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_CONFIG: Record<
  Status,
  { label: string; colorVar: string; bgVar: string }
> = {
  todo: { label: "To Do", colorVar: "var(--status-todo)", bgVar: "var(--status-todo-bg)" },
  in_progress: {
    label: "In Progress",
    colorVar: "var(--status-progress)",
    bgVar: "var(--status-progress-bg)",
  },
  done: { label: "Done", colorVar: "var(--status-done)", bgVar: "var(--status-done-bg)" },
  on_hold: {
    label: "On Hold",
    colorVar: "var(--status-hold)",
    bgVar: "var(--status-hold-bg)",
  },
};
