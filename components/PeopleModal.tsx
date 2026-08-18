"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FunctionReturnType } from "convex/server";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Modal } from "./ui/Modal";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";

type Person = FunctionReturnType<typeof api.people.list>[number];

export function PeopleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const people = useQuery(api.people.list) ?? [];
  const createPerson = useMutation(api.people.create);
  const removePerson = useMutation(api.people.remove);

  const [newName, setNewName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null);

  const addPerson = async () => {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    await createPerson({ name });
  };

  return (
    <Modal open={open} onClose={onClose} title="People" maxWidthClassName="max-w-md" z={60}>
      <div className="p-4">
        <div className="space-y-1">
          {people.map((person) => (
            <PersonRow
              key={person._id}
              person={person}
              onDelete={() => setPendingDelete(person)}
            />
          ))}
          {people.length === 0 && (
            <p className="px-1 py-3 text-[13px] text-muted">No people yet.</p>
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
                void addPerson();
              }
            }}
            placeholder="New person's name…"
            className="flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
          />
          <Button size="sm" variant="secondary" onClick={() => void addPerson()}>
            Add
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void removePerson({ id: pendingDelete._id });
        }}
        title={`Remove "${pendingDelete?.name}"?`}
        description="Tasks and subtasks assigned to this person will become unassigned."
      />
    </Modal>
  );
}

function PersonRow({ person, onDelete }: { person: Person; onDelete: () => void }) {
  const updatePerson = useMutation(api.people.update);
  const [name, setName] = useState(person.name);

  useEffect(() => {
    setName(person.name);
  }, [person.name]);

  return (
    <div className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-surface-hover">
      <Avatar name={person.name} size="sm" />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== person.name) void updatePerson({ id: person._id, name: trimmed });
          else setName(person.name);
        }}
        className="flex-1 bg-transparent text-[13px] text-foreground outline-none"
      />
      <button
        onClick={onDelete}
        className="shrink-0 text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        aria-label="Remove person"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
