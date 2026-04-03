import { Application } from "jsr:@oak/oak";
import { router } from "./routes.ts";
import { Session } from "https://deno.land/x/oak_sessions@v9.0.0/mod.ts";
 
const app = new Application();
 
// Session middleware (must come before router)
app.use(Session.initMiddleware());
 
// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${Date.now() - start}ms`);
});
 
// Static files (CSS, client JS)
app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;
  if (path.startsWith("/static/")) {
    await ctx.send({ root: ".", path });
  } else {
    await next();
  }
});
 
// Routes
app.use(router.routes());
app.use(router.allowedMethods());
 
// 404 fallback
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "<h1>404 — Page not found</h1>";
});
 
console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });
