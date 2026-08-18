"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { CheckSquare, Loader2, Plus, Square, Trash2, UploadCloud, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Status } from "@/lib/status";
import { useUploadImage } from "@/lib/useUploadImage";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { AssigneePicker, ProjectPicker, StatusPicker } from "./pickers";

type TaskDetail = NonNullable<FunctionReturnType<typeof api.tasks.get>>;
type SubtaskDetail = TaskDetail["subtasks"][number];
type Person = FunctionReturnType<typeof api.people.list>[number];

export function TaskModal({
  open,
  onClose,
  taskId,
  defaultStatus = "todo",
}: {
  open: boolean;
  onClose: () => void;
  taskId: Id<"tasks"> | null;
  defaultStatus?: Status;
}) {
  const [activeId, setActiveId] = useState<Id<"tasks"> | null>(taskId);

  useEffect(() => {
    if (open) setActiveId(taskId);
  }, [open, taskId]);

  return (
    <Modal open={open} onClose={onClose} maxWidthClassName="max-w-xl">
      {activeId ? (
        <TaskEditor taskId={activeId} onClose={onClose} />
      ) : (
        <TaskCreateForm
          defaultStatus={defaultStatus}
          onCreated={(id) => setActiveId(id)}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function TaskCreateForm({
  defaultStatus,
  onCreated,
  onClose,
}: {
  defaultStatus: Status;
  onCreated: (id: Id<"tasks">) => void;
  onClose: () => void;
}) {
  const projects = useQuery(api.projects.list) ?? [];
  const people = useQuery(api.people.list) ?? [];
  const createTask = useMutation(api.tasks.create);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [projectId, setProjectId] = useState<Id<"projects"> | null>(null);
  const [assigneeId, setAssigneeId] = useState<Id<"people"> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const effectiveProjectId = projectId ?? projects[0]?._id ?? null;

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || !effectiveProjectId || submitting) return;
    setSubmitting(true);
    try {
      const id = await createTask({
        title: trimmed,
        description: description.trim() || undefined,
        status,
        projectId: effectiveProjectId,
        assigneeId: assigneeId ?? undefined,
      });
      onCreated(id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">New task</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder="Task title"
        className="mt-4 w-full bg-transparent text-[16px] font-medium text-foreground outline-none placeholder:text-muted"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description…"
        rows={3}
        className="mt-2 w-full resize-none bg-transparent text-[13px] leading-relaxed text-muted-strong outline-none placeholder:text-muted"
      />

      {projects.length === 0 ? (
        <p className="mt-3 text-[12px] text-muted">
          Create a project first from the Projects menu.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusPicker value={status} onChange={setStatus} />
          {effectiveProjectId && (
            <ProjectPicker
              projects={projects}
              value={effectiveProjectId}
              onChange={setProjectId}
            />
          )}
          <AssigneePicker people={people as Person[]} value={assigneeId} onChange={setAssigneeId} />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void submit()}
          disabled={!title.trim() || !effectiveProjectId || submitting}
        >
          Create task
        </Button>
      </div>
    </div>
  );
}

function TaskEditor({ taskId, onClose }: { taskId: Id<"tasks">; onClose: () => void }) {
  const data = useQuery(api.tasks.get, { id: taskId });
  const projects = useQuery(api.projects.list) ?? [];
  const people = (useQuery(api.people.list) ?? []) as Person[];
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const createSubtask = useMutation(api.subtasks.create);
  const updateSubtask = useMutation(api.subtasks.update);
  const removeSubtask = useMutation(api.subtasks.remove);
  const uploadImage = useUploadImage();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title);
      setDescription(data.description ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?._id]);

  const uploadFiles = useCallback(
    async (files: File[] | FileList) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (fileArray.length === 0 || uploading || !data) return;
      setUploading(true);
      try {
        const uploaded = await Promise.all(fileArray.map((f) => uploadImage(f)));
        await updateTask({
          id: taskId,
          attachmentIds: [...(data.attachmentIds ?? []), ...uploaded],
        });
      } catch (err) {
        console.error("Failed to upload image:", err);
      } finally {
        setUploading(false);
      }
    },
    [data, taskId, updateTask, uploadImage, uploading],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        void uploadFiles(imageFiles);
      }
    },
    [uploadFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  };

  if (data === undefined) {
    return <div className="p-10 text-center text-[13px] text-muted">Loading…</div>;
  }
  if (data === null) {
    return (
      <div className="p-10 text-center text-[13px] text-muted">
        This task was deleted.
        <div className="mt-4">
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const saveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== data.title) void updateTask({ id: taskId, title: trimmed });
    else setTitle(data.title);
  };

  const saveDescription = () => {
    if (description !== (data.description ?? "")) {
      void updateTask({ id: taskId, description: description.trim() ? description : null });
    }
  };

  const removeAttachment = (id: Id<"_storage">) => {
    void updateTask({
      id: taskId,
      attachmentIds: (data.attachmentIds ?? []).filter((a) => a !== id),
    });
  };

  const addSubtask = async () => {
    const text = newSubtask.trim();
    if (!text) return;
    setNewSubtask("");
    await createSubtask({ taskId, text });
  };

  return (
    <div className="flex flex-col" onPaste={handlePaste}>
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="w-full bg-transparent text-[17px] font-semibold text-foreground outline-none placeholder:text-muted"
            placeholder="Task title"
          />
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Add a description…"
          rows={3}
          className="-mx-3 w-[calc(100%+1.5rem)] resize-none rounded-lg border border-transparent px-3 py-2 text-[13px] leading-relaxed text-muted-strong outline-none transition-colors placeholder:text-muted hover:bg-surface-hover focus:border-border focus:bg-surface-hover"
        />

        <div className="flex flex-wrap gap-2">
          <StatusPicker
            value={data.status}
            onChange={(status) => void updateTask({ id: taskId, status })}
          />
          <ProjectPicker
            projects={projects}
            value={data.projectId}
            onChange={(projectId) => void updateTask({ id: taskId, projectId })}
          />
          <AssigneePicker
            people={people}
            value={data.assigneeId ?? null}
            onChange={(assigneeId) => void updateTask({ id: taskId, assigneeId })}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-strong">Attachments</span>
            <label className="cursor-pointer text-[12px] font-medium text-accent hover:text-accent-hover">
              {uploading ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" /> Uploading…
                </span>
              ) : (
                "Add photo"
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {data.attachments.length > 0 && (
            <div className="mb-2.5 grid grid-cols-4 gap-2">
              {data.attachments.map(
                (a) =>
                  a.url && (
                    <div
                      key={a.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-hover"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.url} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => removeAttachment(a.id)}
                        className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                        aria-label="Remove attachment"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ),
              )}
            </div>
          )}

          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-all ${
              isDragOver
                ? "border-accent bg-accent-soft/40 ring-2 ring-accent/30"
                : "border-border hover:border-border-strong hover:bg-surface-hover/50"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files) void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {uploading ? (
              <div className="flex items-center gap-2 text-[12px] font-medium text-accent">
                <Loader2 size={16} className="animate-spin" />
                <span>Uploading image…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-muted">
                <UploadCloud size={20} className={isDragOver ? "text-accent" : "text-muted"} />
                <p className="text-[12px]">
                  <span className="font-medium text-foreground">Click to upload</span> or drag & drop images
                </p>
                <p className="text-[11px] text-muted">Supports clipboard paste (Ctrl+V / ⌘V)</p>
              </div>
            )}
          </label>
        </div>

        <div>
          <span className="mb-2 block text-[12px] font-semibold text-muted-strong">
            Subtasks
            {data.subtasks.length > 0 &&
              ` (${data.subtasks.filter((s) => s.done).length}/${data.subtasks.length})`}
          </span>
          <div className="space-y-0.5">
            {data.subtasks.map((s) => (
              <SubtaskRow
                key={s._id}
                subtask={s}
                people={people}
                onToggle={(done) => void updateSubtask({ id: s._id, done })}
                onChangeText={(text) => void updateSubtask({ id: s._id, text })}
                onChangeAssignee={(assigneeId) =>
                  void updateSubtask({ id: s._id, assigneeId })
                }
                onDelete={() => void removeSubtask({ id: s._id })}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2 px-1.5 py-1">
            <Plus size={14} className="shrink-0 text-muted" />
            <input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addSubtask();
                }
              }}
              placeholder="Add a subtask…"
              className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger hover:opacity-80"
        >
          <Trash2 size={13} /> Delete task
        </button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void removeTask({ id: taskId });
          onClose();
        }}
        title="Delete this task?"
        description="This permanently deletes the task, its subtasks, and its attachments."
      />
    </div>
  );
}

function SubtaskRow({
  subtask,
  people,
  onToggle,
  onChangeText,
  onChangeAssignee,
  onDelete,
}: {
  subtask: SubtaskDetail;
  people: Person[];
  onToggle: (done: boolean) => void;
  onChangeText: (text: string) => void;
  onChangeAssignee: (id: Id<"people"> | null) => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(subtask.text);

  useEffect(() => {
    setText(subtask.text);
  }, [subtask.text]);

  return (
    <div className="group flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-surface-hover">
      <button
        onClick={() => onToggle(!subtask.done)}
        className="shrink-0 text-muted transition-colors hover:text-accent"
        aria-label="Toggle done"
      >
        {subtask.done ? <CheckSquare size={15} className="text-accent" /> : <Square size={15} />}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const trimmed = text.trim();
          if (trimmed && trimmed !== subtask.text) onChangeText(trimmed);
          else setText(subtask.text);
        }}
        className={`flex-1 bg-transparent text-[13px] outline-none ${
          subtask.done ? "text-muted line-through" : "text-foreground"
        }`}
      />
      <AssigneePicker
        people={people}
        value={subtask.assigneeId ?? null}
        onChange={onChangeAssignee}
        compact
      />
      <button
        onClick={onDelete}
        className="shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Delete subtask"
      >
        <X size={13} />
      </button>
    </div>
  );
}
