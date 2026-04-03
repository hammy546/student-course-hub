import type { BindValue } from "jsr:@db/sqlite";
import type { RouterContext } from "jsr:@oak/oak";
import { db } from "../db.ts";
import { sanitise, sanitiseBody } from "../middleware/sanitise.ts";

type Programme = {
  id: number;
  title: string;
  level: string;
  description: string;
  image_url: string;
};

// GET /
export function listProgrammes(ctx: RouterContext<"/">) {
  const level = ctx.request.url.searchParams.get("level") ?? "";
  const search = sanitise(ctx.request.url.searchParams.get("search") ?? "");

  let query = "SELECT * FROM programmes WHERE published = 1";
  const params: BindValue[] = [];

  if (level === "Undergraduate" || level === "Postgraduate") {
    query += " AND level = ?";
    params.push(level);
  }
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY title";
  const programmes = db.prepare(query).all(...params) as Programme[];

  ctx.response.type = "html";
  ctx.response.body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Programmes — Course Hub</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <h1>Find your programme</h1>
    <nav aria-label="Site navigation">
      <a href="/">Programmes</a>
    </nav>
  </header>
  <main id="main-content">
    <form class="filters" method="GET" action="/" role="search">
      <label for="search" class="sr-only">Search programmes</label>
      <input id="search" name="search" type="search" placeholder="Search programmes…" value="${search}">

      <fieldset>
        <legend class="sr-only">Filter by level</legend>
        <label><input type="radio" name="level" value="" ${!level ? "checked" : ""}> All</label>
        <label><input type="radio" name="level" value="Undergraduate" ${level === "Undergraduate" ? "checked" : ""}> Undergraduate</label>
        <label><input type="radio" name="level" value="Postgraduate" ${level === "Postgraduate" ? "checked" : ""}> Postgraduate</label>
      </fieldset>

      <button type="submit">Filter</button>
    </form>

    <ul class="programme-grid" role="list">
      ${programmes.map((p) => `
        <li>
          <a href="/programmes/${p.id}" class="programme-card">
            ${p.image_url ? `<img src="${sanitise(p.image_url)}" alt="">` : ""}
            <div class="card-body">
              <span class="badge">${sanitise(p.level)}</span>
              <h2>${sanitise(p.title)}</h2>
              <p>${sanitise(p.description).slice(0, 120)}…</p>
            </div>
          </a>
        </li>
      `).join("")}
    </ul>

    ${programmes.length === 0 ? "<p>No programmes found.</p>" : ""}
  </main>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

// GET /programmes/:id
export function getProgramme(ctx: RouterContext<"/programmes/:id">) {
  const id = Number(ctx.params.id);

  const programme = db.prepare(
    "SELECT * FROM programmes WHERE id = ? AND published = 1"
  ).get(id) as Programme | undefined;

  if (!programme) {
    ctx.response.status = 404;
    ctx.response.body = "<h1>Programme not found</h1>";
    return;
  }

  const modules = db.prepare(`
    SELECT m.*, s.name AS leader_name
    FROM modules m
    LEFT JOIN module_leaders ml ON ml.module_id = m.id
    LEFT JOIN staff s ON s.id = ml.staff_id
    WHERE m.programme_id = ?
    ORDER BY m.year, m.title
  `).all(id);

  ctx.response.type = "html";
  ctx.response.body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${sanitise(programme.title)} — Course Hub</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
  <header>
    <a href="/">← All programmes</a>
    <h1>${sanitise(programme.title)}</h1>
    <span class="badge">${sanitise(programme.level)}</span>
  </header>
  <main id="main-content">
    ${programme.image_url ? `<img src="${sanitise(programme.image_url)}" alt="" class="hero-img">` : ""}
    <p>${sanitise(programme.description)}</p>

    <section aria-labelledby="modules-heading">
      <h2 id="modules-heading">Modules</h2>
      ${[1, 2, 3].map((year) => {
        const yearModules = (modules as Array<Record<string, unknown>>).filter((m) => m.year === year);
        if (!yearModules.length) return "";
        return `
          <h3>Year ${year}</h3>
          <ul class="module-list">
            ${yearModules.map((m) => `
              <li class="module-card">
                <h4>${sanitise(m.title as string)}</h4>
                <p>${sanitise(m.description as string)}</p>
                ${m.leader_name ? `<p class="leader">Leader: ${sanitise(m.leader_name as string)}</p>` : ""}
              </li>
            `).join("")}
          </ul>`;
      }).join("")}
    </section>

    <section aria-labelledby="interest-heading" class="interest-section">
      <h2 id="interest-heading">Register your interest</h2>
      <form id="interest-form" data-programme-id="${id}">
        <label for="name">Your name</label>
        <input id="name" name="name" type="text" required autocomplete="name">

        <label for="email">Your email</label>
        <input id="email" name="email" type="email" required autocomplete="email">

        <button type="submit">Register interest</button>
      </form>
      <p id="interest-message" aria-live="polite"></p>
    </section>
  </main>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

// POST /programmes/:id/interest  — returns JSON for fetch API
export async function registerInterest(
  ctx: RouterContext<"/programmes/:id/interest">
) {
  const id = Number(ctx.params.id);
  const body = await ctx.request.body.formData();
  const { name, email } = sanitiseBody({
    name: body.get("name"),
    email: body.get("email"),
  });

  if (!name || !email || !email.includes("@")) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Please provide a valid name and email." };
    return;
  }

  try {
    db.prepare(
      "INSERT INTO student_interests (programme_id, name, email) VALUES (?, ?, ?)"
    ).run(id, name, email);

    ctx.response.body = { success: true, message: "Interest registered!" };
  } catch {
    // UNIQUE constraint violation = already registered
    ctx.response.status = 409;
    ctx.response.body = { error: "You have already registered interest in this programme." };
  }
}

// DELETE /programmes/:id/interest  — returns JSON
export async function withdrawInterest(
  ctx: RouterContext<"/programmes/:id/interest">
) {
  const id = Number(ctx.params.id);
  const body = await ctx.request.body.formData();
  const { email } = sanitiseBody({ email: body.get("email") });

  db.prepare(
    "DELETE FROM student_interests WHERE programme_id = ? AND email = ?"
  ).run(id, email);

  ctx.response.body = { success: true, message: "Interest withdrawn." };
}
