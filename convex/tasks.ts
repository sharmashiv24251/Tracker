import { v } from "convex/values";
import { QueryCtx, mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { taskStatus } from "./schema";

async function resolvePeople(
  ctx: QueryCtx,
  ids: Iterable<Id<"people">>,
): Promise<Map<Id<"people">, Doc<"people">>> {
  const people = new Map<Id<"people">, Doc<"people">>();
  for (const id of ids) {
    const person = await ctx.db.get("people", id);
    if (person) people.set(id, person);
  }
  return people;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").take(1000);

    const projectIds = new Set(tasks.map((t) => t.projectId));
    const projects = new Map<Id<"projects">, Doc<"projects">>();
    for (const id of projectIds) {
      const project = await ctx.db.get("projects", id);
      if (project) projects.set(id, project);
    }

    const assigneeIds = new Set(
      tasks
        .map((t) => t.assigneeId)
        .filter((id): id is Id<"people"> => id !== undefined),
    );
    const people = await resolvePeople(ctx, assigneeIds);

    const result = [];
    for (const task of tasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .take(200);
      const coverUrl = task.attachmentIds?.[0]
        ? await ctx.storage.getUrl(task.attachmentIds[0])
        : null;
      result.push({
        ...task,
        project: projects.get(task.projectId) ?? null,
        assignee: task.assigneeId ? (people.get(task.assigneeId) ?? null) : null,
        subtaskTotal: subtasks.length,
        subtaskDone: subtasks.filter((s) => s.done).length,
        attachmentCount: task.attachmentIds?.length ?? 0,
        coverUrl,
      });
    }
    return result;
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task) return null;
    const project = await ctx.db.get("projects", task.projectId);
    const subtasksRaw = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", task._id))
      .order("asc")
      .take(500);

    const assigneeIds = new Set(
      [task.assigneeId, ...subtasksRaw.map((s) => s.assigneeId)].filter(
        (id): id is Id<"people"> => id !== undefined,
      ),
    );
    const people = await resolvePeople(ctx, assigneeIds);

    const assignee = task.assigneeId ? (people.get(task.assigneeId) ?? null) : null;
    const subtasks = subtasksRaw.map((s) => ({
      ...s,
      assignee: s.assigneeId ? (people.get(s.assigneeId) ?? null) : null,
    }));
    const attachments = task.attachmentIds
      ? await Promise.all(
          task.attachmentIds.map(async (id) => ({
            id,
            url: await ctx.storage.getUrl(id),
          })),
        )
      : [];
    return { ...task, project, assignee, subtasks, attachments };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatus,
    projectId: v.id("projects"),
    assigneeId: v.optional(v.id("people")),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) throw new Error("Title is required");
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("Project not found");
    return await ctx.db.insert("tasks", {
      title,
      description: args.description?.trim() || undefined,
      status: args.status,
      projectId: args.projectId,
      assigneeId: args.assigneeId,
      attachmentIds: args.attachmentIds,
    });
  },
});

type TaskPatch = Partial<{
  title: string;
  description: string | undefined;
  status: Doc<"tasks">["status"];
  projectId: Id<"projects">;
  assigneeId: Id<"people"> | undefined;
  attachmentIds: Id<"_storage">[];
}>;

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    status: v.optional(taskStatus),
    projectId: v.optional(v.id("projects")),
    assigneeId: v.optional(v.union(v.id("people"), v.null())),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("tasks", args.id);
    if (!existing) throw new Error("Task not found");

    const patch: TaskPatch = {};
    if (args.title !== undefined) {
      const title = args.title.trim();
      if (!title) throw new Error("Title is required");
      patch.title = title;
    }
    if (args.description !== undefined) {
      patch.description =
        args.description === null ? undefined : args.description.trim() || undefined;
    }
    if (args.status !== undefined) patch.status = args.status;
    if (args.projectId !== undefined) {
      const project = await ctx.db.get("projects", args.projectId);
      if (!project) throw new Error("Project not found");
      patch.projectId = args.projectId;
    }
    if (args.assigneeId !== undefined) {
      patch.assigneeId = args.assigneeId === null ? undefined : args.assigneeId;
    }
    if (args.attachmentIds !== undefined) {
      patch.attachmentIds = args.attachmentIds;
      const kept = new Set(args.attachmentIds);
      for (const id of existing.attachmentIds ?? []) {
        if (!kept.has(id)) await ctx.storage.delete(id);
      }
    }

    await ctx.db.patch("tasks", args.id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args.id);
    if (!task) return null;
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .take(1000);
    for (const subtask of subtasks) {
      await ctx.db.delete("subtasks", subtask._id);
    }
    if (task.attachmentIds) {
      for (const id of task.attachmentIds) {
        await ctx.storage.delete(id);
      }
    }
    await ctx.db.delete("tasks", args.id);
    return null;
  },
});
