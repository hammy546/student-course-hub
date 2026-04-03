import type { Middleware } from "jsr:@oak/oak";

export const requireAuth: Middleware = async (ctx, next) => {
  const adminId = await ctx.state.session.get("adminId");
  if (!adminId) {
    ctx.response.redirect("/admin/login");
    return;
  }
  await next();
};
