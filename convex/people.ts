import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("people").withIndex("by_name").order("asc").take(200);
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Name is required");
    return await ctx.db.insert("people", { name });
  },
});

export const update = mutation({
  args: { id: v.id("people"), name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Name is required");
    await ctx.db.patch("people", args.id, { name });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.id))
      .take(1000);
    for (const task of tasks) {
      await ctx.db.patch("tasks", task._id, { assigneeId: undefined });
    }
    const subtasks = await ctx.db
      .query("subtasks")
      .filter((q) => q.eq(q.field("assigneeId"), args.id))
      .take(1000);
    for (const subtask of subtasks) {
      await ctx.db.patch("subtasks", subtask._id, { assigneeId: undefined });
    }
    await ctx.db.delete("people", args.id);
    return null;
  },
});
