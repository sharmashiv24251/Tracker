"use client";

import { FunctionReturnType } from "convex/server";
import { UserRound } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { STATUSES, STATUS_CONFIG, Status } from "@/lib/status";
import { Avatar } from "./ui/Avatar";
import { Dropdown } from "./ui/Dropdown";
import { ProjectIcon } from "./ui/ProjectIcon";
import { StatusBadge, StatusDot } from "./StatusBadge";

type Person = FunctionReturnType<typeof api.people.list>[number];

export function StatusPicker({
  value,
  onChange,
}: {
  value: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={STATUSES.map((s) => ({ value: s, label: STATUS_CONFIG[s].label }))}
      renderTrigger={() => <StatusBadge status={value} />}
      renderOption={(opt) => (
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status={opt.value} /> {opt.label}
        </span>
      )}
    />
  );
}

export function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: Doc<"projects">[];
  value: Id<"projects">;
  onChange: (id: Id<"projects">) => void;
}) {
  const current = projects.find((p) => p._id === value);
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={projects.map((p) => ({ value: p._id, label: p.name }))}
      renderTrigger={() => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover">
          {current && <ProjectIcon name={current.name} color={current.color} size="xs" />}
          {current?.name ?? "Select project"}
        </span>
      )}
      renderOption={(opt) => {
        const project = projects.find((p) => p._id === opt.value);
        return (
          <span className="inline-flex items-center gap-1.5">
            {project && <ProjectIcon name={project.name} color={project.color} size="xs" />}
            {opt.label}
          </span>
        );
      }}
    />
  );
}

export function AssigneePicker({
  people,
  value,
  onChange,
  compact = false,
}: {
  people: Person[];
  value: Id<"people"> | null;
  onChange: (id: Id<"people"> | null) => void;
  compact?: boolean;
}) {
  const current = people.find((p) => p._id === value);
  const options = [
    { value: "unassigned", label: "Unassigned" },
    ...people.map((p) => ({ value: p._id as string, label: p.name })),
  ];
  return (
    <Dropdown
      value={value ?? "unassigned"}
      onChange={(v) => onChange(v === "unassigned" ? null : (v as Id<"people">))}
      options={options}
      align={compact ? "right" : "left"}
      renderTrigger={() =>
        compact ? (
          <span className="block rounded-full transition-opacity hover:opacity-80">
            {current ? (
              <Avatar name={current.name} size="xs" />
            ) : (
              <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-border-strong text-muted">
                <UserRound size={11} />
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-surface-hover">
            {current ? <Avatar name={current.name} size="xs" /> : <UserRound size={12} className="text-muted" />}
            {current?.name ?? "Unassigned"}
          </span>
        )
      }
      renderOption={(opt) => (
        <span className="inline-flex items-center gap-1.5">
          {opt.value !== "unassigned" ? (
            <Avatar name={people.find((p) => p._id === opt.value)?.name ?? ""} size="xs" />
          ) : (
            <UserRound size={12} className="text-muted" />
          )}
          {opt.label}
        </span>
      )}
    />
  );
}
