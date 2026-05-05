import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise } from "../middleware/sanitise.ts";

//bcrypt for password hashing
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// GET /admin/login
export async function loginPage(ctx: RouterContext<"/admin/login">) {
  const error = await ctx.state.session.get("loginError");
  await ctx.state.session.set("loginError", null);

  ctx.response.body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin Login</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <main class="auth-page" id="main-content">
    <h1>Admin login</h1>
    ${error ? `<p class="error" role="alert">${sanitise(error)}</p>` : ""}
    <form method="POST" action="/admin/login">
      <label for="username">Username</label>
      <input id="username" name="username" type="text" required autocomplete="username">

      <label for="password">Password</label>
      <input id="password" name="password" type="password" required autocomplete="current-password">

      <button type="submit">Log in</button>
    </form>
  </main>
</body>
</html>`;
}

// POST /admin/login
export async function login(ctx: RouterContext<"/admin/login">) {
  const body = await ctx.request.body.formData();
  const username = sanitise(body.get("username"));
  const password = body.get("password") as string; // raw — needed for bcrypt compare

  // Parameterised query prevents SQL injection
  const admin = db.prepare(
    "SELECT id, password_hash FROM admins WHERE username = ?"
  ).get(username) as { id: number; password_hash: string } | undefined;

  if (!admin || !(await compare(password, admin.password_hash))) {
    await ctx.state.session.set("loginError", "Invalid username or password");
    ctx.response.redirect("/admin/login");
    return;
  }

  await ctx.state.session.set("adminId", admin.id);
  ctx.response.redirect("/admin");
}

// POST /admin/logout
export async function logout(ctx: RouterContext<"/admin/logout">) {
  await ctx.state.session.deleteSession();
  ctx.response.redirect("/admin/login");
}