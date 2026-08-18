import { internalMutation } from "./_generated/server";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingProjects = await ctx.db.query("projects").take(1);
    if (existingProjects.length === 0) {
      const names = ["Give Give", "No Stress Agents", "Others", "Gudforus"];
      const palette = ["#5c6ce0", "#e5484d", "#1a9e6f", "#c8760a"];
      for (let i = 0; i < names.length; i++) {
        await ctx.db.insert("projects", { name: names[i], color: palette[i % palette.length] });
      }
    }

    const existingPeople = await ctx.db.query("people").take(1);
    if (existingPeople.length === 0) {
      for (const name of ["Shivansh", "Saransh"]) {
        await ctx.db.insert("people", { name });
      }
    }
    return null;
  },
});
