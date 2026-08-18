"use client";

import { useMemo, useState } from "react";
import { FunctionReturnType } from "convex/server";
import { useMutation } from "convex/react";
import {
  Plus,
  Search,
  X,
  ListChecks,
  Paperclip,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUSES, STATUS_CONFIG, Status } from "@/lib/status";
import { StatusBadge, StatusDot } from "./StatusBadge";
import { Avatar } from "./ui/Avatar";
import { ProjectIcon } from "./ui/ProjectIcon";
import { StatusPicker } from "./pickers";

type TaskListItem = FunctionReturnType<typeof api.tasks.list>[number];

export function MobileTaskList({
  tasks,
  onTaskClick,
  onAddTask,
}: {
  tasks: TaskListItem[];
  onTaskClick: (id: Id<"tasks">) => void;
  onAddTask: (status?: Status) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<Status | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const removeTask = useMutation(api.tasks.remove);
  const updateTask = useMutation(api.tasks.update);

  // Status counts
  const counts = useMemo(() => {
    const map: Record<Status | "all", number> = {
      all: tasks.length,
      todo: 0,
      in_progress: 0,
      done: 0,
      on_hold: 0,
    };
    for (const t of tasks) {
      if (map[t.status] !== undefined) {
        map[t.status]++;
      }
    }
    return map;
  }, [tasks]);

  // Filter tasks by status and search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedStatus !== "all" && t.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchProject = t.project?.name.toLowerCase().includes(q);
        const matchAssignee = t.assignee?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchProject && !matchAssignee) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedStatus, searchQuery]);

  const handleDelete = (e: React.MouseEvent, taskId: Id<"tasks">) => {
    e.stopPropagation();
    void removeTask({ id: taskId });
  };

  const handleStatusChange = (taskId: Id<"tasks">, status: Status) => {
    void updateTask({ id: taskId, status });
  };

  return (
    <div className="flex flex-1 flex-col px-4 pb-20 pt-1">
      {/* Mobile Controls: Status Filter Pills & Search Toggle */}
      <div className="sticky top-[108px] z-20 -mx-4 bg-background/95 px-4 pb-3 pt-1 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* "All" filter pill */}
          <button
            onClick={() => setSelectedStatus("all")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              selectedStatus === "all"
                ? "bg-foreground text-background shadow-sm"
                : "bg-surface border border-border text-muted-strong hover:bg-surface-hover"
            }`}
          >
            All
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                selectedStatus === "all"
                  ? "bg-background/20 text-background"
                  : "bg-border text-muted"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* Status filter pills */}
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const isActive = selectedStatus === status;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                  isActive
                    ? "shadow-sm ring-1 ring-border"
                    : "bg-surface border border-border text-muted-strong hover:bg-surface-hover"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: config.bgVar,
                        color: config.colorVar,
                      }
                    : undefined
                }
              >
                <StatusDot status={status} />
                {config.label}
                <span
                  className="rounded-full px-1.5 py-0.2 text-[10px] font-semibold opacity-80"
                  style={
                    isActive
                      ? {
                          backgroundColor: config.colorVar,
                          color: "#fff",
                        }
                      : {
                          backgroundColor: "var(--border)",
                          color: "var(--muted)",
                        }
                  }
                >
                  {counts[status]}
                </span>
              </button>
            );
          })}

          {/* Search Toggle Button */}
          <button
            onClick={() => {
              setShowSearch((prev) => !prev);
              if (showSearch) setSearchQuery("");
            }}
            aria-label="Toggle search"
            className={`inline-flex shrink-0 items-center justify-center rounded-full p-2 text-xs transition-colors ${
              showSearch || searchQuery
                ? "bg-accent-soft text-accent"
                : "bg-surface border border-border text-muted hover:bg-surface-hover"
            }`}
          >
            <Search size={14} />
          </button>
        </div>

        {/* Expandable Search Input */}
        {showSearch && (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 shadow-sm">
            <Search size={14} className="shrink-0 text-muted" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks by name, assignee, project…"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="shrink-0 text-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task List Content */}
      <div className="mt-2 flex flex-col gap-2.5">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
            <SlidersHorizontal size={24} className="mb-2 text-muted" />
            <p className="text-[13px] font-medium text-foreground">No tasks found</p>
            <p className="mt-0.5 text-[12px] text-muted">
              {searchQuery
                ? "Try clearing your search query"
                : selectedStatus !== "all"
                ? `No tasks in "${STATUS_CONFIG[selectedStatus].label}"`
                : "Create your first task to get started"}
            </p>
            <button
              onClick={() => onAddTask(selectedStatus !== "all" ? selectedStatus : "todo")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white shadow-sm hover:bg-accent-hover"
            >
              <Plus size={13} />
              Add task
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              onClick={() => onTaskClick(task._id)}
              className="group relative flex flex-col rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all active:scale-[0.99] active:bg-surface-hover"
            >
              {/* Cover Image thumbnail if present */}
              {task.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.coverUrl}
                  alt=""
                  className="mb-2.5 h-32 w-full rounded-lg object-cover"
                />
              )}

              {/* Top Row: Project & Quick Status Changer */}
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate text-[11px] font-medium text-muted">
                  {task.project ? (
                    <>
                      <ProjectIcon
                        name={task.project.name}
                        color={task.project.color}
                        size="xs"
                      />
                      <span className="truncate">{task.project.name}</span>
                    </>
                  ) : (
                    <span>General</span>
                  )}
                </div>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0"
                >
                  <StatusPicker
                    value={task.status}
                    onChange={(newStatus) => handleStatusChange(task._id, newStatus)}
                  />
                </div>
              </div>

              {/* Task Title */}
              <h3 className="text-[14px] font-medium leading-snug text-foreground">
                {task.title}
              </h3>

              {/* Description preview */}
              {task.description && (
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                  {task.description}
                </p>
              )}

              {/* Bottom Row: Subtasks, Attachments, Assignee, Delete */}
              <div className="mt-3 flex items-center justify-between pt-1 text-[11px] text-muted">
                <div className="flex items-center gap-3">
                  {task.subtaskTotal > 0 && (
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        task.subtaskDone === task.subtaskTotal
                          ? "text-status-done"
                          : "text-muted"
                      }`}
                    >
                      <ListChecks size={13} />
                      {task.subtaskDone}/{task.subtaskTotal}
                    </span>
                  )}
                  {task.attachmentCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Paperclip size={13} />
                      {task.attachmentCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, task._id)}
                    aria-label="Delete task"
                    className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger active:bg-danger-soft active:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                  {task.assignee && (
                    <Avatar name={task.assignee.name} size="xs" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => onAddTask(selectedStatus !== "all" ? selectedStatus : "todo")}
        aria-label="Create new task"
        className="fixed bottom-6 right-5 z-30 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/30 transition-transform active:scale-95"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}
