import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    text: v.string(),
    assigneeId: v.optional(v.id("people")),
  },
  handler: async (ctx, args) => {
    const text = args.text.trim();
    if (!text) throw new Error("Subtask text is required");
    const task = await ctx.db.get("tasks", args.taskId);
    if (!task) throw new Error("Task not found");
    return await ctx.db.insert("subtasks", {
      taskId: args.taskId,
      text,
      assigneeId: args.assigneeId,
      done: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subtasks"),
    text: v.optional(v.string()),
    assigneeId: v.optional(v.union(v.id("people"), v.null())),
    done: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get("subtasks", args.id);
    if (!existing) throw new Error("Subtask not found");
    const patch: Partial<{
      text: string;
      assigneeId: Id<"people"> | undefined;
      done: boolean;
    }> = {};
    if (args.text !== undefined) {
      const text = args.text.trim();
      if (!text) throw new Error("Subtask text is required");
      patch.text = text;
    }
    if (args.assigneeId !== undefined) {
      patch.assigneeId = args.assigneeId === null ? undefined : args.assigneeId;
    }
    if (args.done !== undefined) patch.done = args.done;
    await ctx.db.patch("subtasks", args.id, patch);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("subtasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete("subtasks", args.id);
    return null;
  },
});
