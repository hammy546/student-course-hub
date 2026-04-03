import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise } from "../middleware/sanitise.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type StaffRow = { id: number; name: string; email: string; bio: string; image_url: string };
type ProgrammeRow = { id: number; title: string; level: string; published: number; interest_count: number };
type ModuleRow = { id: number; title: string; description: string; year: number; programme_title: string; programme_id: number };

// ─── Layout ───────────────────────────────────────────────────────────────────

function portalLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${sanitise(title)} — Staff Portal</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <a href="/"><strong>Student Course Hub</strong></a>
    <nav aria-label="Site navigation">
      <a href="/">Browse programmes</a>
      <a href="/staff/portal" class="active">Staff portal</a>
    </nav>
  </header>
  <main id="main-content" class="container">${content}</main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} Student Course Hub</p>
  </footer>
</body>
</html>`;
}

// ─── GET /staff/portal ────────────────────────────────────────────────────────
// Shows the email lookup form
export function portalHome(ctx: RouterContext<"/staff/portal">) {
  ctx.response.type = "html";
  ctx.response.body = portalLayout("Staff Portal", `
    <section class="portal-hero">
      <h1>Staff Portal</h1>
      <p>Enter your staff email address to view the programmes and modules you lead.</p>
    </section>

    <div class="portal-lookup-card">
      <form method="POST" action="/staff/portal">
        <label for="email">Staff email address</label>
        <div class="input-row">
          <input
            id="email"
            name="email"
            type="email"
            required
            autocomplete="email"
            placeholder="e.g. j.smith@university.ac.uk"
          >
          <button type="submit" class="btn">View my dashboard</button>
        </div>
      </form>
    </div>
  `);
}

// ─── POST /staff/portal ───────────────────────────────────────────────────────
// Looks up staff by email and renders their dashboard
export async function portalLookup(ctx: RouterContext<"/staff/portal">) {
  const body = await ctx.request.body.formData();
  const rawEmail = (body.get("email") ?? "").toString().trim().toLowerCase();

  if (!rawEmail) {
    ctx.response.redirect("/staff/portal");
    return;
  }

  const staff = db.prepare(
    "SELECT * FROM staff WHERE LOWER(email) = ?"
  ).get(rawEmail) as StaffRow | undefined;

  if (!staff) {
    ctx.response.type = "html";
    ctx.response.body = portalLayout("Staff Portal", `
      <section class="portal-hero">
        <h1>Staff Portal</h1>
        <p>Enter your staff email address to view the programmes and modules you lead.</p>
      </section>
      <div class="portal-lookup-card">
        <p class="error" role="alert">No staff member found for <strong>${sanitise(rawEmail)}</strong>. Please check your email address or contact an administrator.</p>
        <form method="POST" action="/staff/portal">
          <label for="email">Staff email address</label>
          <div class="input-row">
            <input id="email" name="email" type="email" required
              autocomplete="email" placeholder="e.g. j.smith@university.ac.uk"
              value="${sanitise(rawEmail)}">
            <button type="submit" class="btn">View my dashboard</button>
          </div>
        </form>
      </div>
    `);
    return;
  }

  // Programmes this staff member leads
  const programmes = db.prepare(`
    SELECT p.id, p.title, p.level, p.published,
           COUNT(si.id) AS interest_count
    FROM programme_leaders pl
    JOIN programmes p ON p.id = pl.programme_id
    LEFT JOIN student_interests si ON si.programme_id = p.id
    WHERE pl.staff_id = ?
    GROUP BY p.id
    ORDER BY p.title
  `).all(staff.id) as ProgrammeRow[];

  // Modules this staff member leads
  const modules = db.prepare(`
    SELECT m.id, m.title, m.description, m.year,
           p.title AS programme_title, p.id AS programme_id
    FROM module_leaders ml
    JOIN modules m ON m.id = ml.module_id
    JOIN programmes p ON p.id = m.programme_id
    WHERE ml.staff_id = ?
    ORDER BY p.title, m.year, m.title
  `).all(staff.id) as ModuleRow[];

  // Group modules by programme for display
  const modulesByProgramme = modules.reduce<Record<number, { title: string; modules: ModuleRow[] }>>(
    (acc, m) => {
      if (!acc[m.programme_id]) {
        acc[m.programme_id] = { title: m.programme_title, modules: [] };
      }
      acc[m.programme_id].modules.push(m);
      return acc;
    },
    {}
  );

  ctx.response.type = "html";
  ctx.response.body = portalLayout(`${staff.name} — Dashboard`, `
    <div class="portal-profile">
      ${staff.image_url
        ? `<img src="${sanitise(staff.image_url)}" alt="Photo of ${sanitise(staff.name)}" width="72" height="72" loading="lazy" class="portal-avatar">`
        : `<div class="portal-avatar portal-avatar--initials" aria-hidden="true">${sanitise(staff.name).split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</div>`
      }
      <div>
        <h1>${sanitise(staff.name)}</h1>
        <p class="muted"><a href="mailto:${sanitise(staff.email)}">${sanitise(staff.email)}</a></p>
        ${staff.bio ? `<p class="portal-bio">${sanitise(staff.bio)}</p>` : ""}
      </div>
    </div>

    <form method="POST" action="/staff/portal" style="margin-bottom:2rem">
      <input type="hidden" name="email" value="${sanitise(staff.email)}">
      <button type="submit" class="btn-secondary">&#8635; Refresh</button>
      <a href="/staff/portal" class="btn-secondary" style="margin-left:0.5rem">Switch account</a>
    </form>

    <!-- Programme leadership -->
    <section class="portal-section">
      <h2>Programmes I lead
        <span class="badge">${programmes.length}</span>
      </h2>

      ${programmes.length === 0
        ? `<p class="muted">You are not currently listed as a programme leader. Contact an administrator to update your roles.</p>`
        : `<div class="programme-grid">
            ${programmes.map((p) => `
              <div class="programme-card">
                <div class="programme-card__body">
                  <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
                    <span class="badge badge--${p.published ? "published" : "draft"}">${p.published ? "Published" : "Draft"}</span>
                    <span class="badge badge--level">${sanitise(p.level)}</span>
                  </div>
                  <h3><a href="/programmes/${p.id}">${sanitise(p.title)}</a></h3>
                  <p class="muted interest-count">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    ${p.interest_count} student${p.interest_count === 1 ? "" : "s"} registered interest
                  </p>
                </div>
              </div>
            `).join("")}
          </div>`
      }
    </section>

    <!-- Module leadership -->
    <section class="portal-section">
      <h2>Modules I lead
        <span class="badge">${modules.length}</span>
      </h2>

      ${modules.length === 0
        ? `<p class="muted">You are not currently listed as a module leader. Contact an administrator to update your roles.</p>`
        : Object.values(modulesByProgramme).map((group) => `
            <div class="module-group">
              <h3 class="module-group__heading">${sanitise(group.title)}</h3>
              <ul class="module-list">
                ${group.modules.map((m) => `
                  <li class="module-item">
                    <div class="module-item__year">Year ${m.year}</div>
                    <div class="module-item__content">
                      <strong>${sanitise(m.title)}</strong>
                      ${m.description ? `<p class="muted">${sanitise(m.description)}</p>` : ""}
                    </div>
                  </li>
                `).join("")}
              </ul>
            </div>
          `).join("")
      }
    </section>
  `);
}
