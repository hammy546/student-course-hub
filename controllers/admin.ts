import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise, sanitiseBody } from "../middleware/sanitise.ts";

// GET /admin
export function dashboard(ctx: RouterContext<"/admin">) {
  const totalProgrammes = (db.prepare("SELECT COUNT(*) as n FROM programmes").get() as { n: number }).n;
  const published = (db.prepare("SELECT COUNT(*) as n FROM programmes WHERE published=1").get() as { n: number }).n;
  const interests = (db.prepare("SELECT COUNT(*) as n FROM student_interests").get() as { n: number }).n;
  const totalStaff = (db.prepare("SELECT COUNT(*) as n FROM staff").get() as { n: number }).n;

  ctx.response.type = "html";
  ctx.response.body = adminLayout("Dashboard", `
    <div class="stats">
      <div class="stat"><strong>${totalProgrammes}</strong><span>Programmes</span></div>
      <div class="stat"><strong>${published}</strong><span>Published</span></div>
      <div class="stat"><strong>${interests}</strong><span>Interest registrations</span></div>
      <div class="stat"><strong>${totalStaff}</strong><span>Staff members</span></div>
    </div>
    <nav class="admin-nav">
      <a href="/admin/programmes">Manage programmes</a>
      <a href="/admin/staff">Manage staff</a>
    </nav>
  `);
}

// GET /admin/programmes
export function listProgrammes(ctx: RouterContext<"/admin/programmes">) {
  const programmes = db.prepare("SELECT * FROM programmes ORDER BY title").all();

  ctx.response.type = "html";
  ctx.response.body = adminLayout("Programmes", `
    <div class="toolbar">
      <h2>Programmes</h2>
      <a href="/admin/programmes/new" class="btn">+ New programme</a>
    </div>
    <table>
      <thead>
        <tr>
          <th>Title</th><th>Level</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${(programmes as Array<Record<string, unknown>>).map((p) => `
          <tr>
            <td>${sanitise(p.title as string)}</td>
            <td>${sanitise(p.level as string)}</td>
            <td>${p.published ? "Published" : "Draft"}</td>
            <td>
              <a href="/admin/programmes/${p.id}/edit">Edit</a>
              <a href="/admin/programmes/${p.id}/modules">Modules</a>
              <a href="/admin/programmes/${p.id}/interest">Mailing list</a>
              <form method="POST" action="/admin/programmes/${p.id}/publish" style="display:inline">
                <button type="submit">${p.published ? "Unpublish" : "Publish"}</button>
              </form>
              <form method="POST" action="/admin/programmes/${p.id}/delete" style="display:inline"
                    onsubmit="return confirm('Delete this programme?')">
                <button type="submit" class="btn-danger">Delete</button>
              </form>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

// GET /admin/programmes/new
export function newProgrammeForm(ctx: RouterContext<"/admin/programmes/new">) {
  ctx.response.type = "html";
  ctx.response.body = adminLayout("New programme", programmeForm());
}

// POST /admin/programmes
export async function createProgramme(ctx: RouterContext<"/admin/programmes">) {
  const body = await ctx.request.body.formData();
  const { title, level, description, image_url } = sanitiseBody({
    title: body.get("title"),
    level: body.get("level"),
    description: body.get("description"),
    image_url: body.get("image_url"),
  });

  db.prepare(
    "INSERT INTO programmes (title, level, description, image_url) VALUES (?, ?, ?, ?)"
  ).run(title, level, description, image_url);

  ctx.response.redirect("/admin/programmes");
}

// GET /admin/programmes/:id/edit
export function editProgrammeForm(
  ctx: RouterContext<"/admin/programmes/:id/edit">
) {
  const p = db.prepare("SELECT * FROM programmes WHERE id = ?").get(
    Number(ctx.params.id)
  ) as Record<string, unknown> | undefined;

  if (!p) { ctx.response.status = 404; ctx.response.body = "Not found"; return; }

  ctx.response.type = "html";
  ctx.response.body = adminLayout(
    `Edit: ${sanitise(p.title as string)}`,
    programmeForm(p)
  );
}

// POST /admin/programmes/:id
export async function updateProgramme(
  ctx: RouterContext<"/admin/programmes/:id">
) {
  const body = await ctx.request.body.formData();
  const { title, level, description, image_url } = sanitiseBody({
    title: body.get("title"),
    level: body.get("level"),
    description: body.get("description"),
    image_url: body.get("image_url"),
  });

  db.prepare(
    "UPDATE programmes SET title=?, level=?, description=?, image_url=? WHERE id=?"
  ).run(title, level, description, image_url, Number(ctx.params.id));

  ctx.response.redirect("/admin/programmes");
}

// POST /admin/programmes/:id/delete
export function deleteProgramme(
  ctx: RouterContext<"/admin/programmes/:id/delete">
) {
  db.prepare("DELETE FROM programmes WHERE id = ?").run(Number(ctx.params.id));
  ctx.response.redirect("/admin/programmes");
}

// POST /admin/programmes/:id/publish
export function togglePublish(
  ctx: RouterContext<"/admin/programmes/:id/publish">
) {
  db.prepare(
    "UPDATE programmes SET published = NOT published WHERE id = ?"
  ).run(Number(ctx.params.id));
  ctx.response.redirect("/admin/programmes");
}

// GET /admin/programmes/:id/interest
export function viewInterest(
  ctx: RouterContext<"/admin/programmes/:id/interest">
) {
  const id = Number(ctx.params.id);
  const programme = db.prepare("SELECT title FROM programmes WHERE id=?").get(id) as { title: string } | undefined;
  if (!programme) { ctx.response.status = 404; return; }

  const students = db.prepare(
    "SELECT name, email, registered_at FROM student_interests WHERE programme_id=? ORDER BY registered_at DESC"
  ).all(id) as Array<{ name: string; email: string; registered_at: string }>;

  ctx.response.type = "html";
  ctx.response.body = adminLayout(`Interest: ${sanitise(programme.title)}`, `
    <div class="toolbar">
      <h2>Mailing list — ${sanitise(programme.title)}</h2>
      <a href="/admin/programmes/${id}/interest/export" class="btn">Export CSV</a>
    </div>
    <table>
      <thead><tr><th>Name</th><th>Email</th><th>Registered</th><th>Action</th></tr></thead>
      <tbody>
        ${students.map((s) => `
          <tr>
            <td>${sanitise(s.name)}</td>
            <td>${sanitise(s.email)}</td>
            <td>${sanitise(s.registered_at)}</td>
            <td>
              <form method="POST" action="/admin/programmes/${id}/interest/${encodeURIComponent(s.email)}/delete">
                <button type="submit" class="btn-danger">Remove</button>
              </form>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${students.length === 0 ? "<p>No registrations yet.</p>" : ""}
  `);
}

// GET /admin/programmes/:id/interest/export  — CSV download
export function exportMailingList(
  ctx: RouterContext<"/admin/programmes/:id/interest/export">
) {
  const id = Number(ctx.params.id);
  const students = db.prepare(
    "SELECT name, email, registered_at FROM student_interests WHERE programme_id=? ORDER BY name"
  ).all(id) as Array<{ name: string; email: string; registered_at: string }>;

  const csv = [
    "name,email,registered_at",
    ...students.map((s) => `"${s.name}","${s.email}","${s.registered_at}"`),
  ].join("\n");

  ctx.response.headers.set("Content-Disposition", `attachment; filename="mailing-list-${id}.csv"`);
  ctx.response.type = "text/csv";
  ctx.response.body = csv;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function adminLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${sanitise(title)} — Admin</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body class="admin">
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <a href="/admin"><strong>Course Hub Admin</strong></a>
    <nav aria-label="Admin navigation">
      <a href="/admin/programmes">Programmes</a>
      <a href="/admin/staff">Staff</a>
      <form method="POST" action="/admin/logout" style="display:inline">
        <button type="submit">Log out</button>
      </form>
    </nav>
  </header>
  <main id="main-content">${content}</main>
</body>
</html>`;
}

function programmeForm(p: Record<string, unknown> = {}): string {
  const action = p.id ? `/admin/programmes/${p.id}` : "/admin/programmes";
  return `
    <form method="POST" action="${action}">
      <label for="title">Title</label>
      <input id="title" name="title" type="text" required value="${sanitise(p.title as string ?? "")}">

      <label for="level">Level</label>
      <select id="level" name="level" required>
        <option value="Undergraduate" ${p.level === "Undergraduate" ? "selected" : ""}>Undergraduate</option>
        <option value="Postgraduate" ${p.level === "Postgraduate" ? "selected" : ""}>Postgraduate</option>
      </select>

      <label for="description">Description</label>
      <textarea id="description" name="description" rows="5">${sanitise(p.description as string ?? "")}</textarea>

      <label for="image_url">Image URL</label>
      <input id="image_url" name="image_url" type="url" value="${sanitise(p.image_url as string ?? "")}">

      <button type="submit">${p.id ? "Save changes" : "Create programme"}</button>
      <a href="/admin/programmes">Cancel</a>
      ${p.id ? `<a href="/admin/programmes/${p.id}/modules" class="btn-secondary">Manage modules →</a>` : ""}
    </form>`;
}