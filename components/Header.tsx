"use client";

import { useQuery } from "convex/react";
import { FolderKanban, Plus, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { ProjectIcon } from "./ui/ProjectIcon";

export function Header({
  selectedProjectId,
  onSelectProject,
  selectedAssigneeId,
  onSelectAssignee,
  onNewTask,
  onOpenProjects,
  onOpenPeople,
}: {
  selectedProjectId: Id<"projects"> | null;
  onSelectProject: (id: Id<"projects"> | null) => void;
  selectedAssigneeId: Id<"people"> | null;
  onSelectAssignee: (id: Id<"people"> | null) => void;
  onNewTask: () => void;
  onOpenProjects: () => void;
  onOpenPeople: () => void;
}) {
  const projects = useQuery(api.projects.list) ?? [];
  const people = useQuery(api.people.list) ?? [];

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-2.5 sm:gap-3 border-b border-border bg-background/80 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="truncate text-[15px] sm:text-[16px] font-semibold tracking-tight text-foreground font-heading">
            who&apos;s working on what?
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenPeople}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-muted-strong transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Users size={14} />
            <span className="hidden sm:inline">People</span>
          </button>
          <button
            onClick={onOpenProjects}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 sm:px-2.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-muted-strong transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <FolderKanban size={14} />
            <span className="hidden sm:inline">Projects</span>
          </button>

          <Button variant="primary" size="sm" onClick={onNewTask} className="sm:h-9 sm:px-3.5">
            <Plus size={14} />
            <span>Task</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center -space-x-1.5 shrink-0">
          {people.map((person) => (
            <button
              key={person._id}
              onClick={() =>
                onSelectAssignee(selectedAssigneeId === person._id ? null : person._id)
              }
              title={person.name}
              className={`rounded-full transition-all ${
                selectedAssigneeId && selectedAssigneeId !== person._id
                  ? "opacity-40 hover:opacity-80"
                  : "opacity-100"
              } ${selectedAssigneeId === person._id ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
            >
              <Avatar name={person.name} size="sm" />
            </button>
          ))}
        </div>

        <div className="h-5 w-px shrink-0 bg-border" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelectProject(null)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
              selectedProjectId === null
                ? "bg-accent-soft text-accent"
                : "text-muted-strong hover:bg-surface-hover"
            }`}
          >
            All Projects
          </button>
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                selectedProjectId === project._id
                  ? "bg-accent-soft text-accent"
                  : "text-muted-strong hover:bg-surface-hover"
              }`}
            >
              <ProjectIcon name={project.name} color={project.color} size="xs" />
              {project.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
