import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const PROJECT_PALETTE = [
  "#5c6ce0",
  "#e5484d",
  "#1a9e6f",
  "#c8760a",
  "#0891b2",
  "#a855f7",
  "#d6409f",
  "#65a30d",
];

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("projects").withIndex("by_name").order("asc").take(200);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Project name is required");
    const count = (await ctx.db.query("projects").take(1000)).length;
    const color = PROJECT_PALETTE[count % PROJECT_PALETTE.length];
    return await ctx.db.insert("projects", { name, color });
  },
});

export const update = mutation({
  args: { id: v.id("projects"), name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Project name is required");
    await ctx.db.patch("projects", args.id, { name });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .take(1000);
    for (const task of tasks) {
      const subtasks = await ctx.db
        .query("subtasks")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .take(1000);
      for (const subtask of subtasks) {
        await ctx.db.delete("subtasks", subtask._id);
      }
      if (task.attachmentIds) {
        for (const storageId of task.attachmentIds) {
          await ctx.storage.delete(storageId);
        }
      }
      await ctx.db.delete("tasks", task._id);
    }
    await ctx.db.delete("projects", args.id);
    return null;
  },
});
