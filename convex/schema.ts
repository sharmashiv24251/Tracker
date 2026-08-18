import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const taskStatus = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("on_hold"),
);

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    color: v.string(),
  }).index("by_name", ["name"]),

  people: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: taskStatus,
    projectId: v.id("projects"),
    assigneeId: v.optional(v.id("people")),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_assignee", ["assigneeId"]),

  subtasks: defineTable({
    taskId: v.id("tasks"),
    text: v.string(),
    assigneeId: v.optional(v.id("people")),
    done: v.boolean(),
  }).index("by_task", ["taskId"]),
});
