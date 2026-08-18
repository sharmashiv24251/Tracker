"use client";

import { useDroppable } from "@dnd-kit/core";
import { FunctionReturnType } from "convex/server";
import { Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { STATUS_CONFIG, Status } from "@/lib/status";
import { TaskCard } from "./TaskCard";
import { StatusDot } from "./StatusBadge";

type TaskListItem = FunctionReturnType<typeof api.tasks.list>[number];

export function Column({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  status: Status;
  tasks: TaskListItem[];
  onTaskClick: (id: TaskListItem["_id"]) => void;
  onAddTask: (status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <StatusDot status={status} />
        <h2 className="text-[13px] font-semibold text-foreground">{config.label}</h2>
        <span className="text-[12px] text-muted">{tasks.length}</span>
        <button
          onClick={() => onAddTask(status)}
          className="ml-auto rounded-md p-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label={`Add task to ${config.label}`}
        >
          <Plus size={14} />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border p-1.5 transition-colors ${
          isOver ? "border-accent/40 bg-accent-soft/40" : "border-transparent"
        }`}
      >
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task._id)} />
        ))}
        {tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12px] text-muted">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}
