"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Button } from "./ui/Button";
import { ProjectIcon } from "./ui/ProjectIcon";

export function ProjectsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const projects = useQuery(api.projects.list) ?? [];
  const createProject = useMutation(api.projects.create);
  const removeProject = useMutation(api.projects.remove);
  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Doc<"projects"> | null>(null);

  const addProject = async () => {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    await createProject({ name });
  };

  return (
    <Modal open={open} onClose={onClose} title="Projects" maxWidthClassName="max-w-md" z={60}>
      <div className="p-4">
        <div className="space-y-1">
          {projects.map((project) => (
            <ProjectRow
              key={project._id}
              project={project}
              onDelete={() => setPendingDelete(project)}
            />
          ))}
          {projects.length === 0 && (
            <p className="px-1 py-3 text-[13px] text-muted">No projects yet.</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Plus size={14} className="shrink-0 text-muted" />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addProject();
              }
            }}
            placeholder="New project name…"
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
          />
          <Button size="sm" variant="secondary" onClick={() => void addProject()}>
            Add
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removeProject({ id: pendingDelete._id });
        }}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This permanently deletes the project along with every task and subtask inside it."
      />
    </Modal>
  );
}

function ProjectRow({
  project,
  onDelete,
}: {
  project: Doc<"projects">;
  onDelete: () => void;
}) {
  const updateProject = useMutation(api.projects.update);
  const [name, setName] = useState(project.name);

  useEffect(() => {
    setName(project.name);
  }, [project.name]);

  return (
    <div className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-hover">
      <ProjectIcon name={project.name} color={project.color} size="sm" />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== project.name) void updateProject({ id: project._id, name: trimmed });
          else setName(project.name);
        }}
        className="flex-1 bg-transparent text-[13px] text-foreground outline-none"
      />
      <button
        onClick={onDelete}
        className="shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete project"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
