import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise, sanitiseBody } from "../middleware/sanitise.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Staff = {
  id: number;
  name: string;
  email: string;
  bio: string;
  image_url: string;
};

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

function staffForm(s: Partial<Staff> = {}): string {
  const action = s.id ? `/admin/staff/${s.id}` : "/admin/staff";
  return `
    <form method="POST" action="${action}">
      <label for="name">Full name</label>
      <input id="name" name="name" type="text" required
             value="${sanitise(s.name ?? "")}">

      <label for="email">Email</label>
      <input id="email" name="email" type="email" required
             value="${sanitise(s.email ?? "")}">

      <label for="bio">Bio</label>
      <textarea id="bio" name="bio" rows="4">${sanitise(s.bio ?? "")}</textarea>

      <label for="image_url">Image URL</label>
      <input id="image_url" name="image_url" type="url"
             value="${sanitise(s.image_url ?? "")}">

      <div class="form-actions">
        <button type="submit">${s.id ? "Save changes" : "Add staff member"}</button>
        <a href="/admin/staff">Cancel</a>
      </div>
    </form>`;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET /admin/staff
export function listStaff(ctx: RouterContext<"/admin/staff">) {
  const staff = db.prepare("SELECT * FROM staff ORDER BY name").all() as Staff[];

  // For each staff member, fetch their programme and module responsibilities
  const withRoles = staff.map((s) => {
    const programmes = db.prepare(`
      SELECT p.title FROM programme_leaders pl
      JOIN programmes p ON p.id = pl.programme_id
      WHERE pl.staff_id = ?
      ORDER BY p.title
    `).all(s.id) as { title: string }[];

    const modules = db.prepare(`
      SELECT m.title FROM module_leaders ml
      JOIN modules m ON m.id = ml.module_id
      WHERE ml.staff_id = ?
      ORDER BY m.title
    `).all(s.id) as { title: string }[];

    return { ...s, programmes, modules };
  });

  ctx.response.type = "html";
  ctx.response.body = adminLayout("Staff", `
    <div class="toolbar">
      <h2>Staff</h2>
      <a href="/admin/staff/new" class="btn">+ Add staff member</a>
    </div>

    ${withRoles.length === 0 ? "<p>No staff yet. Add one above.</p>" : ""}

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Programme leader</th>
          <th>Module leader</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${withRoles.map((s) => `
          <tr>
            <td>${sanitise(s.name)}</td>
            <td>${sanitise(s.email)}</td>
            <td>${s.programmes.length
              ? s.programmes.map((p) => sanitise(p.title)).join(", ")
              : "<em>None</em>"
            }</td>
            <td>${s.modules.length
              ? s.modules.map((m) => sanitise(m.title)).join(", ")
              : "<em>None</em>"
            }</td>
            <td>
              <a href="/admin/staff/${s.id}/edit">Edit</a>
              <form method="POST" action="/admin/staff/${s.id}/delete"
                    style="display:inline"
                    onsubmit="return confirm('Delete ${sanitise(s.name)}?')">
                <button type="submit" class="btn-danger">Delete</button>
              </form>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `);
}

// GET /admin/staff/new
export function newStaffForm(ctx: RouterContext<"/admin/staff/new">) {
  ctx.response.type = "html";
  ctx.response.body = adminLayout("New staff member", `
    <a href="/admin/staff">← Back to staff</a>
    <h2 style="margin: 1rem 0">Add staff member</h2>
    ${staffForm()}
  `);
}

// POST /admin/staff
export async function createStaff(ctx: RouterContext<"/admin/staff">) {
  const body = await ctx.request.body.formData();
  const { name, email, bio, image_url } = sanitiseBody({
    name: body.get("name"),
    email: body.get("email"),
    bio: body.get("bio"),
    image_url: body.get("image_url"),
  });

  try {
    db.prepare(
      "INSERT INTO staff (name, email, bio, image_url) VALUES (?, ?, ?, ?)"
    ).run(name, email, bio, image_url);
  } catch {
    // UNIQUE constraint on email
    ctx.response.type = "html";
    ctx.response.body = adminLayout("New staff member", `
      <a href="/admin/staff">← Back to staff</a>
      <h2 style="margin: 1rem 0">Add staff member</h2>
      <p class="error">A staff member with that email already exists.</p>
      ${staffForm({ name, email, bio, image_url })}
    `);
    return;
  }

  ctx.response.redirect("/admin/staff");
}

// GET /admin/staff/:id/edit
export function editStaffForm(ctx: RouterContext<"/admin/staff/:id/edit">) {
  const s = db.prepare("SELECT * FROM staff WHERE id = ?").get(
    Number(ctx.params.id)
  ) as Staff | undefined;

  if (!s) {
    ctx.response.status = 404;
    ctx.response.body = "Staff member not found";
    return;
  }

  // Also show which programmes this person can be assigned as leader
  const allProgrammes = db.prepare(
    "SELECT id, title FROM programmes ORDER BY title"
  ).all() as { id: number; title: string }[];

  const leadingProgrammes = db.prepare(
    "SELECT programme_id FROM programme_leaders WHERE staff_id = ?"
  ).all(s.id) as { programme_id: number }[];

  const leadingIds = new Set(leadingProgrammes.map((r) => r.programme_id));

  ctx.response.type = "html";
  ctx.response.body = adminLayout(`Edit — ${sanitise(s.name)}`, `
    <a href="/admin/staff">← Back to staff</a>
    <h2 style="margin: 1rem 0">Edit: ${sanitise(s.name)}</h2>
    ${staffForm(s)}

    <section style="margin-top: 2rem">
      <h3 style="margin-bottom: 1rem; font-size: 0.875rem; font-weight: 600;
                 text-transform: uppercase; letter-spacing: 0.06em; color: var(--col-muted)">
        Programme leadership
      </h3>
      <form method="POST" action="/admin/staff/${s.id}/programmes">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem">
          ${allProgrammes.map((p) => `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 400">
              <input type="checkbox" name="programme_ids" value="${p.id}"
                     ${leadingIds.has(p.id) ? "checked" : ""}>
              ${sanitise(p.title)}
            </label>
          `).join("")}
        </div>
        <button type="submit">Save programme roles</button>
      </form>
    </section>
  `);
}

// POST /admin/staff/:id
export async function updateStaff(ctx: RouterContext<"/admin/staff/:id">) {
  const id = Number(ctx.params.id);
  const body = await ctx.request.body.formData();
  const { name, email, bio, image_url } = sanitiseBody({
    name: body.get("name"),
    email: body.get("email"),
    bio: body.get("bio"),
    image_url: body.get("image_url"),
  });

  db.prepare(
    "UPDATE staff SET name=?, email=?, bio=?, image_url=? WHERE id=?"
  ).run(name, email, bio, image_url, id);

  ctx.response.redirect("/admin/staff");
}

// POST /admin/staff/:id/programmes  — update programme leader assignments
export async function updateProgrammeRoles(
  ctx: RouterContext<"/admin/staff/:id/programmes">
) {
  const staffId = Number(ctx.params.id);
  const body = await ctx.request.body.formData();

  // getAll returns all values for a multi-value field
  const programmeIds = body.getAll("programme_ids").map(Number);

  // Replace all assignments for this staff member
  db.prepare("DELETE FROM programme_leaders WHERE staff_id = ?").run(staffId);

  for (const progId of programmeIds) {
    db.prepare(
      "INSERT OR IGNORE INTO programme_leaders (programme_id, staff_id) VALUES (?, ?)"
    ).run(progId, staffId);
  }

  ctx.response.redirect(`/admin/staff/${staffId}/edit`);
}

// POST /admin/staff/:id/delete
export function deleteStaff(ctx: RouterContext<"/admin/staff/:id/delete">) {
  // Foreign key CASCADE removes programme_leaders and module_leaders rows
  db.prepare("DELETE FROM staff WHERE id = ?").run(Number(ctx.params.id));
  ctx.response.redirect("/admin/staff");
}