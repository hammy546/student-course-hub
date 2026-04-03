# Student Course Hub

A full-stack university course directory built with **Deno**, **Oak**, and **SQLite**. Prospective students can browse degree programmes, view modules and staff, and register their interest. Administrators manage all content through a protected admin panel.

Built as part of CTEC3705: Advanced Web Development.

---

## Features

**Student-facing site**
- Browse undergraduate and postgraduate degree programmes
- Filter by level, search by keyword
- View modules grouped by year of study
- See staff members and module leaders
- Register or withdraw interest in a programme (async, no page reload)
- Fully responsive, mobile-friendly layout
- WCAG 2.1 AA accessible — keyboard navigation, skip links, semantic HTML, sufficient contrast

**Admin panel**
- Session-based login with bcrypt password hashing
- Role-based access control — all admin routes protected by auth middleware
- Full CRUD for programmes, modules, and staff
- Publish / unpublish programmes
- View and remove student interest registrations per programme
- Export mailing lists as CSV
- Assign programme leaders and module leaders to staff members

**Security**
- SQL injection prevention via parameterised queries throughout
- XSS prevention via HTML escaping on all user input before storage or display
- Session-based authentication with server-side session storage

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | [Deno](https://deno.com) |
| Web framework | [Oak](https://jsr.io/@oak/oak) v17 |
| Database | SQLite via [@db/sqlite](https://jsr.io/@db/sqlite) |
| Sessions | [@oak/sessions](https://jsr.io/@oak/sessions) |
| Password hashing | [bcrypt](https://deno.land/x/bcrypt) |
| Templating | TypeScript template literals (server-side rendering) |
| Styling | Vanilla CSS — custom properties, container queries, CSS Grid |

---

## Project structure

```
├── main.ts                  # Entry point — Oak app, middleware setup
├── routes.ts                # All URL routes mapped to controllers
├── db.ts                    # SQLite connection and schema creation
├── deno.json                # Tasks and import map
│
├── controllers/
│   ├── programme.ts         # Student-facing pages
│   ├── admin.ts             # Admin programme management
│   ├── modules.ts           # Admin module management
│   ├── staff.ts             # Admin staff management
│   └── auth.ts              # Login, logout, session
│
├── middleware/
│   ├── auth.ts              # requireAuth guard for admin routes
│   └── sanitise.ts          # HTML escaping to prevent XSS
│
├── static/
│   ├── style.css            # All styles — public site + admin panel
│   └── app.js               # Client-side fetch for interest form
│
└── scripts/
    └── seed.ts              # Creates admin user and sample data
```

---

## Getting started

### Prerequisites

- [Deno](https://deno.com) v1.40 or later

### Install and run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/student-course-hub.git
cd student-course-hub

# Seed the database (creates admin user + sample data)
deno task seed

# Start the development server (auto-restarts on file changes)
deno task dev
```

Then open [http://localhost:8000](http://localhost:8000).

### Available tasks

| Task | Command | Description |
|---|---|---|
| Development | `deno task dev` | Start server with file watching |
| Production | `deno task start` | Start server without watching |
| Seed | `deno task seed` | Populate database with sample data |

---

## Admin access

After running `deno task seed`:

| Field | Value |
|---|---|
| URL | http://localhost:8000/admin |
| Username | `admin` |
| Password | `admin123` |

> **Change these credentials** before deploying to a public server.

---

## Architecture notes

The app follows the **MVC pattern**:

- **Models** — SQL queries in each controller file, executed via `db.prepare(...)`
- **Views** — HTML returned as template literal strings from view helper functions (`adminLayout`, `programmeForm` etc.)
- **Controllers** — functions in `controllers/` that handle requests, query the database, and return responses

Two rendering approaches are used side by side (relevant for comparing SSR vs client-side updates):

- **Server-side rendering** — most pages return a full HTML string built on the server
- **Client-side updates** — the interest registration form in `static/app.js` uses the Fetch API to POST to a JSON endpoint and updates the DOM without a page reload

---

## Database schema

```
programmes ──< modules
programmes ──< programme_leaders >── staff
modules    ──< module_leaders    >── staff
programmes ──< student_interests
```

All foreign keys use `ON DELETE CASCADE` so deleting a programme automatically removes its modules, leader assignments, and interest registrations.

---

## License

MIT
