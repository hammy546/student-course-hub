import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise, sanitiseBody } from "../middleware/sanitise.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Programme = { id: number; title: string };
type Module = {
  id: number;
  programme_id: number;
  title: string;
  description: string;
  year: number;
  image_url: string;
};
type Staff = { id: number; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProgrammeOrFail(
  id: number,
  ctx: { response: RouterContext<string>["response"] }
): Programme | null {
  const p = db
    .prepare("SELECT id, title FROM programmes WHERE id = ?")
    .get(id) as Programme | undefined;
  if (!p) {
    ctx.response.status = 404;
    ctx.response.body = "Programme not found";
    return null;
  }
  return p;
}

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
  <header>
    <a href="/admin"><strong>Course Hub Admin</strong></a>
    <nav aria-label="Admin navigation">
      <a href="/admin/programmes">Programmes</a>
      <form method="POST" action="/admin/logout" style="display:inline">
        <button type="submit">Log out</button>
      </form>
    </nav>
  </header>
  <main>${content}</main>
</body>
</html>`;
}

function moduleForm(
  programmeId: number,
  allStaff: Staff[],
  mod: Partial<Module> = {},
  currentLeaderId?: number
): string {
  const action = mod.id
    ? `/admin/programmes/${programmeId}/modules/${mod.id}`
    : `/admin/programmes/${programmeId}/modules`;

  return `
    <form method="POST" action="${action}">
      <label for="title">Module title</label>
      <input id="title" name="title" type="text" required
             value="${sanitise(mod.title ?? "")}">

      <label for="year">Year of study</label>
      <select id="year" name="year" required>
        ${[1, 2, 3, 4].map((y) => `
          <option value="${y}" ${mod.year === y ? "selected" : ""}>${y}</option>
        `).join("")}
      </select>

      <label for="description">Description</label>
      <textarea id="description" name="description"
                rows="4">${sanitise(mod.description ?? "")}</textarea>

      <label for="image_url">Image URL</label>
      <input id="image_url" name="image_url" type="url"
             value="${sanitise(mod.image_url ?? "")}">

      <label for="leader_id">Module leader</label>
      <select id="leader_id" name="leader_id">
        <option value="">— No leader assigned —</option>
        ${allStaff.map((s) => `
          <option value="${s.id}" ${currentLeaderId === s.id ? "selected" : ""}>
            ${sanitise(s.name)}
          </option>
        `).join("")}
      </select>

      <div class="form-actions">
        <button type="submit">${mod.id ? "Save changes" : "Add module"}</button>
        <a href="/admin/programmes/${programmeId}/modules">Cancel</a>
      </div>
    </form>`;
}

/** Returns every programme (other than the owner) that shares this module. */
function getSharedProgrammes(moduleId: number, ownerProgrammeId: number): Programme[] {
  return db.prepare(`
    SELECT p.id, p.title
    FROM programme_modules pm
    JOIN programmes p ON p.id = pm.programme_id
    WHERE pm.module_id = ? AND pm.programme_id != ?
    ORDER BY p.title
  `).all(moduleId, ownerProgrammeId) as Programme[];
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET /admin/programmes/:id/modules
export function listModules(
  ctx: RouterContext<"/admin/programmes/:id/modules">
) {
  const progId = Number(ctx.params.id);
  const programme = getProgrammeOrFail(progId, ctx);
  if (!programme) return;

  // Fetch modules joined with their leader name (if assigned)
  const modules = db.prepare(`
    SELECT m.*, s.name AS leader_name, s.id AS leader_id
    FROM modules m
    LEFT JOIN module_leaders ml ON ml.module_id = m.id
    LEFT JOIN staff s ON s.id = ml.staff_id
    WHERE m.programme_id = ?
    ORDER BY m.year, m.title
  `).all(progId) as Array<Module & { leader_name?: string; leader_id?: number }>;

  // Group by year for display
  const byYear = [1, 2, 3, 4].map((year) => ({
    year,
    modules: modules.filter((m) => m.year === year),
  })).filter((g) => g.modules.length > 0);

  ctx.response.type = "html";
  ctx.response.body = adminLayout(
    `Modules — ${programme.title}`,
    `
    <div class="toolbar">
      <div>
        <a href="/admin/programmes">← Programmes</a>
        <h2>Modules — ${sanitise(programme.title)}</h2>
      </div>
      <a href="/admin/programmes/${progId}/modules/new" class="btn">+ Add module</a>
    </div>

    ${byYear.length === 0 ? "<p>No modules yet. Add one above.</p>" : ""}

    ${byYear.map(({ year, modules: mods }) => `
      <section aria-labelledby="year-${year}-heading">
        <h3 id="year-${year}-heading">Year ${year}</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Module leader</th>
              <th>Shared with</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${mods.map((m) => {
              const shared = getSharedProgrammes(m.id, progId);
              return `
              <tr>
                <td>${sanitise(m.title)}</td>
                <td>${m.leader_name ? sanitise(m.leader_name) : "<em>None assigned</em>"}</td>
                <td>
                  ${shared.length > 0
                    ? shared.map((p) => `<span class="badge badge--shared">${sanitise(p.title)}</span>`).join(" ")
                    : "<em>—</em>"}
                </td>
                <td>
                  <a href="/admin/programmes/${progId}/modules/${m.id}/edit">Edit</a>
                  <form method="POST"
                        action="/admin/programmes/${progId}/modules/${m.id}/delete"
                        style="display:inline"
                        onsubmit="return confirm('Delete this module?')">
                    <button type="submit" class="btn-danger">Delete</button>
                  </form>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </section>
    `).join("")}
    `
  );
}

// GET /admin/programmes/:id/modules/new
export function newModuleForm(
  ctx: RouterContext<"/admin/programmes/:id/modules/new">
) {
  const progId = Number(ctx.params.id);
  const programme = getProgrammeOrFail(progId, ctx);
  if (!programme) return;

  const allStaff = db.prepare("SELECT id, name FROM staff ORDER BY name").all() as Staff[];

  ctx.response.type = "html";
  ctx.response.body = adminLayout(
    `New module — ${programme.title}`,
    `
    <a href="/admin/programmes/${progId}/modules">← Back to modules</a>
    <h2>Add module to ${sanitise(programme.title)}</h2>
    ${moduleForm(progId, allStaff)}
    `
  );
}

// POST /admin/programmes/:id/modules
export async function createModule(
  ctx: RouterContext<"/admin/programmes/:id/modules">
) {
  const progId = Number(ctx.params.id);
  const programme = getProgrammeOrFail(progId, ctx);
  if (!programme) return;

  const body = await ctx.request.body.formData();
  const { title, description, image_url } = sanitiseBody({
    title: body.get("title"),
    description: body.get("description"),
    image_url: body.get("image_url"),
  });
  const year = Number(body.get("year")) || 1;
  const leaderId = body.get("leader_id") ? Number(body.get("leader_id")) : null;

  // Parameterised insert — safe from SQL injection
  db.prepare(`
    INSERT INTO modules (programme_id, title, description, year, image_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(progId, title, description, year, image_url);

  const moduleId = (
    db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number }
  ).id;

  if (leaderId) {
    db.prepare(
      "INSERT OR REPLACE INTO module_leaders (module_id, staff_id) VALUES (?, ?)"
    ).run(moduleId, leaderId);
  }

  // Register this module in the junction table for its owning programme
  db.prepare(
    "INSERT OR IGNORE INTO programme_modules (programme_id, module_id) VALUES (?, ?)"
  ).run(progId, moduleId);

  ctx.response.redirect(`/admin/programmes/${progId}/modules`);
}

// GET /admin/programmes/:id/modules/:moduleId/edit
export function editModuleForm(
  ctx: RouterContext<"/admin/programmes/:id/modules/:moduleId/edit">
) {
  const progId = Number(ctx.params.id);
  const moduleId = Number(ctx.params.moduleId);

  const programme = getProgrammeOrFail(progId, ctx);
  if (!programme) return;

  const mod = db.prepare(
    "SELECT * FROM modules WHERE id = ? AND programme_id = ?"
  ).get(moduleId, progId) as Module | undefined;

  if (!mod) {
    ctx.response.status = 404;
    ctx.response.body = "Module not found";
    return;
  }

  const allStaff = db.prepare("SELECT id, name FROM staff ORDER BY name").all() as Staff[];

  const currentLeader = db.prepare(`
    SELECT staff_id FROM module_leaders WHERE module_id = ?
  `).get(moduleId) as { staff_id: number } | undefined;

  // Programmes currently sharing this module (excluding owner)
  const sharedWith = getSharedProgrammes(moduleId, progId);

  // All other programmes available to share with
  const allProgrammes = db.prepare(
    "SELECT id, title FROM programmes WHERE id != ? ORDER BY title"
  ).all(progId) as Programme[];

  ctx.response.type = "html";
  ctx.response.body = adminLayout(
    `Edit module — ${mod.title}`,
    `
    <a href="/admin/programmes/${progId}/modules">← Back to modules</a>
    <h2>Edit: ${sanitise(mod.title)}</h2>
    ${moduleForm(progId, allStaff, mod, currentLeader?.staff_id)}

    <hr>
    <section aria-labelledby="sharing-heading">
      <h3 id="sharing-heading">Shared with other programmes</h3>
      <p>This module currently appears in:</p>
      <ul>
        <li><strong>${sanitise(programme.title)}</strong> (owner)</li>
        ${sharedWith.map((p) => `
          <li>
            ${sanitise(p.title)}
            <form method="POST" action="/admin/programmes/${progId}/modules/${moduleId}/share/${p.id}/remove" style="display:inline">
              <button type="submit" class="btn-danger btn-sm">Remove</button>
            </form>
          </li>
        `).join("")}
      </ul>

      ${allProgrammes.filter((p) => !sharedWith.find((s) => s.id === p.id)).length > 0 ? `
      <form method="POST" action="/admin/programmes/${progId}/modules/${moduleId}/share">
        <label for="share_programme_id">Also share with:</label>
        <select id="share_programme_id" name="share_programme_id">
          <option value="">— Select a programme —</option>
          ${allProgrammes
            .filter((p) => !sharedWith.find((s) => s.id === p.id))
            .map((p) => `<option value="${p.id}">${sanitise(p.title)}</option>`)
            .join("")}
        </select>
        <button type="submit" class="btn">Share</button>
      </form>` : "<p>This module is shared with all other programmes.</p>"}
    </section>
    `
  );
}

// POST /admin/programmes/:id/modules/:moduleId
export async function updateModule(
  ctx: RouterContext<"/admin/programmes/:id/modules/:moduleId">
) {
  const progId = Number(ctx.params.id);
  const moduleId = Number(ctx.params.moduleId);

  const body = await ctx.request.body.formData();
  const { title, description, image_url } = sanitiseBody({
    title: body.get("title"),
    description: body.get("description"),
    image_url: body.get("image_url"),
  });
  const year = Number(body.get("year")) || 1;
  const leaderId = body.get("leader_id") ? Number(body.get("leader_id")) : null;

  db.prepare(`
    UPDATE modules
    SET title = ?, description = ?, year = ?, image_url = ?
    WHERE id = ? AND programme_id = ?
  `).run(title, description, year, image_url, moduleId, progId);

  // Replace leader assignment
  db.prepare("DELETE FROM module_leaders WHERE module_id = ?").run(moduleId);
  if (leaderId) {
    db.prepare(
      "INSERT INTO module_leaders (module_id, staff_id) VALUES (?, ?)"
    ).run(moduleId, leaderId);
  }

  ctx.response.redirect(`/admin/programmes/${progId}/modules`);
}

// POST /admin/programmes/:id/modules/:moduleId/delete
export function deleteModule(
  ctx: RouterContext<"/admin/programmes/:id/modules/:moduleId/delete">
) {
  const progId = Number(ctx.params.id);
  const moduleId = Number(ctx.params.moduleId);

  // CASCADE in the schema handles module_leaders + programme_modules deletion automatically
  db.prepare(
    "DELETE FROM modules WHERE id = ? AND programme_id = ?"
  ).run(moduleId, progId);

  ctx.response.redirect(`/admin/programmes/${progId}/modules`);
}

// POST /admin/programmes/:id/modules/:moduleId/share
export async function shareModule(
  ctx: RouterContext<"/admin/programmes/:id/modules/:moduleId/share">
) {
  const progId = Number(ctx.params.id);
  const moduleId = Number(ctx.params.moduleId);

  const body = await ctx.request.body.formData();
  const targetId = Number(body.get("share_programme_id"));

  if (targetId) {
    db.prepare(
      "INSERT OR IGNORE INTO programme_modules (programme_id, module_id) VALUES (?, ?)"
    ).run(targetId, moduleId);
  }

  ctx.response.redirect(`/admin/programmes/${progId}/modules/${moduleId}/edit`);
}

// POST /admin/programmes/:id/modules/:moduleId/share/:targetId/remove
export function unshareModule(
  ctx: RouterContext<"/admin/programmes/:id/modules/:moduleId/share/:targetId/remove">
) {
  const progId = Number(ctx.params.id);
  const moduleId = Number(ctx.params.moduleId);
  const targetId = Number(ctx.params.targetId);

  // Never remove from the owning programme
  if (targetId !== progId) {
    db.prepare(
      "DELETE FROM programme_modules WHERE programme_id = ? AND module_id = ?"
    ).run(targetId, moduleId);
  }

  ctx.response.redirect(`/admin/programmes/${progId}/modules/${moduleId}/edit`);
}
