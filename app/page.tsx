"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Status } from "@/lib/status";
import { Header } from "@/components/Header";
import { Board } from "@/components/Board";
import { TaskModal } from "@/components/TaskModal";
import { ProjectsModal } from "@/components/ProjectsModal";
import { PeopleModal } from "@/components/PeopleModal";

export default function Home() {
  const tasks = useQuery(api.tasks.list);

  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<Id<"people"> | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<Id<"tasks"> | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Status>("todo");

  const [projectsOpen, setProjectsOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      if (selectedProjectId && task.projectId !== selectedProjectId) return false;
      if (selectedAssigneeId && task.assigneeId !== selectedAssigneeId) return false;
      return true;
    });
  }, [tasks, selectedProjectId, selectedAssigneeId]);

  const openNewTask = (status: Status = "todo") => {
    setActiveTaskId(null);
    setDefaultStatus(status);
    setTaskModalOpen(true);
  };

  const openTask = (id: Id<"tasks">) => {
    setActiveTaskId(id);
    setTaskModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <Header
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        selectedAssigneeId={selectedAssigneeId}
        onSelectAssignee={setSelectedAssigneeId}
        onNewTask={() => openNewTask()}
        onOpenProjects={() => setProjectsOpen(true)}
        onOpenPeople={() => setPeopleOpen(true)}
      />

      <main className="flex flex-1 flex-col pt-5">
        {tasks === undefined ? (
          <div className="flex flex-1 items-center justify-center text-[13px] text-muted">
            Loading…
          </div>
        ) : (
          <Board tasks={filteredTasks} onTaskClick={openTask} onAddTask={openNewTask} />
        )}
      </main>

      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        taskId={activeTaskId}
        defaultStatus={defaultStatus}
      />
      <ProjectsModal open={projectsOpen} onClose={() => setProjectsOpen(false)} />
      <PeopleModal open={peopleOpen} onClose={() => setPeopleOpen(false)} />
    </div>
  );
}
