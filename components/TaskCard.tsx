"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FunctionReturnType } from "convex/server";
import { Paperclip, ListChecks } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "./ui/Avatar";
import { ProjectIcon } from "./ui/ProjectIcon";

type TaskListItem = FunctionReturnType<typeof api.tasks.list>[number];

export function TaskCard({
  task,
  onClick,
}: {
  task: TaskListItem;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="card-shadow group cursor-pointer touch-none rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-border-strong"
    >
      {task.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={task.coverUrl}
          alt=""
          className="mb-2.5 h-28 w-full rounded-lg object-cover"
        />
      )}

      {task.project && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <ProjectIcon name={task.project.name} color={task.project.color} size="xs" />
          {task.project.name}
        </div>
      )}

      <div className="text-[13px] font-medium leading-snug text-foreground">{task.title}</div>

      {task.description && (
        <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
          {task.description}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[11px] text-muted">
          {task.subtaskTotal > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks size={12} />
              {task.subtaskDone}/{task.subtaskTotal}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={12} />
              {task.attachmentCount}
            </span>
          )}
        </div>
        {task.assignee && <Avatar name={task.assignee.name} size="xs" />}
      </div>
    </div>
  );
}
