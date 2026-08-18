"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from "@dnd-kit/core";
import { useMutation } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { STATUSES, Status } from "@/lib/status";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";

type TaskListItem = FunctionReturnType<typeof api.tasks.list>[number];

export function Board({
  tasks,
  onTaskClick,
  onAddTask,
}: {
  tasks: TaskListItem[];
  onTaskClick: (id: Id<"tasks">) => void;
  onAddTask: (status: Status) => void;
}) {
  const updateTask = useMutation(api.tasks.update);
  const [activeTask, setActiveTask] = useState<TaskListItem | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, Status>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Clear optimistic override once the server state catches up
  useEffect(() => {
    setOptimisticStatuses((prev) => {
      let hasChange = false;
      const next = { ...prev };
      for (const task of tasks) {
        if (next[task._id] === task.status) {
          delete next[task._id];
          hasChange = true;
        }
      }
      return hasChange ? next : prev;
    });
  }, [tasks]);

  const displayTasks = useMemo(() => {
    return tasks.map((t) => {
      const override = optimisticStatuses[t._id];
      return override ? { ...t, status: override } : t;
    });
  }, [tasks, optimisticStatuses]);

  const byStatus = (status: Status) => displayTasks.filter((t) => t.status === status);

  // Prioritize pointer location for drop target detection, fallback to bounding box
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  function handleDragStart(event: DragStartEvent) {
    const task = displayTasks.find((t) => t._id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as Status;
    if (!STATUSES.includes(newStatus)) return;

    const taskId = active.id as Id<"tasks">;
    const task = displayTasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Instantly reflect change locally so it doesn't snap back
    setOptimisticStatuses((prev) => ({ ...prev, [taskId]: newStatus }));

    // Send mutation to server
    updateTask({ id: taskId, status: newStatus }).catch((err) => {
      console.error("Failed to update task status:", err);
      setOptimisticStatuses((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex flex-1 gap-5 overflow-x-auto px-6 pb-6">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={byStatus(status)}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask && (
          <div className="w-[288px] rotate-2 shadow-2xl cursor-grabbing pointer-events-none">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
