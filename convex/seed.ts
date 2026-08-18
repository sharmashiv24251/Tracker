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

    const existingPeople = await ctx.db.query("people").collect();
    if (existingPeople.length === 0) {
      for (const name of ["Shivansh Sharma", "Saransh Haseeja"]) {
        await ctx.db.insert("people", { name });
      }
    } else {
      for (const person of existingPeople) {
        if (person.name === "Shivansh") {
          await ctx.db.patch("people", person._id, { name: "Shivansh Sharma" });
        } else if (person.name === "Saransh" || person.name === "Saransh Hasija") {
          await ctx.db.patch("people", person._id, { name: "Saransh Hasija" });
        }
      }
    }
    return null;
  },
});
