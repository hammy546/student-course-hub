# Student Course Hub

A full-stack university course directory built with **Deno**, **Oak**, and **SQLite**. Prospective students can browse degree programmes, view modules and staff, and register their interest. Staff can view their own teaching responsibilities through a self-service portal. Administrators manage all content through a protected admin panel.

Built as part of CTEC3705: Advanced Web Development.

---

## Features

**Student-facing site**
- Browse undergraduate and postgraduate degree programmes
- Filter by level, search by keyword
- View modules grouped by year of study
- See programme leaders and module leaders
- Register or withdraw interest in a programme (async, no page reload)
- Fully responsive, mobile-friendly layout
- WCAG 2.1 AA accessible — keyboard navigation, skip links, semantic HTML, sufficient contrast

**Staff portal** (`/staff/portal`)
- Email-based self-service lookup — no separate login required
- View all programmes you lead, with live student interest counts
- View all modules you lead, grouped by programme and ordered by year
- Initials avatar fallback when no profile photo is set

**Admin panel** (`/admin`)
- Session-based login with bcrypt password hashing
- All admin routes protected by auth middleware
- Full CRUD for programmes, modules, and staff
- Publish / unpublish programmes
- View and individually remove student interest registrations per programme
- Export mailing lists as CSV (filename derived from programme title)
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
├── main.ts                   # Entry point — Oak app, middleware setup
├── routes.ts                 # All URL routes mapped to controllers
├── db.ts                     # SQLite connection and schema creation
├── deno.json                 # Tasks and import map
│
├── controllers/
│   ├── programme.ts          # Student-facing programme pages
│   ├── admin.ts              # Admin programme & interest management
│   ├── modules.ts            # Admin module management
│   ├── staff.ts              # Admin staff management
│   ├── staffPortal.ts        # Staff self-service portal (email lookup)
│   └── auth.ts               # Login, logout, session
│
├── middleware/
│   ├── auth.ts               # requireAuth guard for admin routes
│   └── sanitise.ts           # HTML escaping to prevent XSS
│
├── static/
│   ├── style.css             # All styles — public site, staff portal & admin panel
│   └── app.js                # Client-side fetch for interest form
│
└── scripts/
    └── seed.ts               # Creates admin user and sample data
```

---

## Getting started

### Prerequisites

- [Deno](https://deno.com) v1.40 or later

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/hammy546/student-course-hub.git
cd student-course-hub

# 2. Seed the database (creates admin user + sample programmes, modules & staff)
deno task seed

# 3. Start the development server (auto-restarts on file changes)
deno task dev
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Available tasks

| Task | Command | Description |
|---|---|---|
| `dev` | `deno task dev` | Start server with file watching (recommended for development) |
| `start` | `deno task start` | Start server without watching (production-like) |
| `seed` | `deno task seed` | Populate database with sample programmes, modules, staff, and admin credentials |

> **Note:** `deno task seed` is idempotent — re-running it will not duplicate data. Run it once before first use.

---

## Routes at a glance

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Browse all published programmes |
| `GET` | `/programmes/:id` | Programme detail — modules, staff, interest form |
| `POST` | `/programmes/:id/interest` | Register interest |
| `DELETE` | `/programmes/:id/interest` | Withdraw interest |
| `GET` | `/staff/portal` | Staff portal — email lookup form |
| `POST` | `/staff/portal` | Staff portal — personal dashboard |
| `GET` | `/admin` | Admin dashboard |
| `GET/POST` | `/admin/programmes` | List and create programmes |
| `GET/POST` | `/admin/programmes/:id/edit` | Edit a programme |
| `POST` | `/admin/programmes/:id/publish` | Toggle publish status |
| `GET` | `/admin/programmes/:id/interest` | View mailing list |
| `GET` | `/admin/programmes/:id/interest/export` | Download mailing list as CSV |
| `POST` | `/admin/programmes/:id/interest/:email/delete` | Remove a single registration |
| `GET/POST` | `/admin/staff` | List and create staff |
| `GET/POST` | `/admin/staff/:id/edit` | Edit staff profile and programme roles |

---

## Admin access

After running `deno task seed`:

| Field | Value |
|---|---|
| URL | `http://localhost:8000/admin` |
| Username | `admin` |
| Password | `admin123` |

> **Change these credentials** before deploying to a public server.

## Staff portal access

The staff portal uses **email lookup** — no separate password is required. After seeding, visit `/staff/portal` and enter any staff email address from the database to view that staff member's dashboard.

---

## Architecture notes

The app follows the **MVC pattern**:

- **Models** — SQL queries in each controller file, executed via `db.prepare(...)`
- **Views** — HTML returned as template literal strings from view helper functions (`adminLayout`, `portalLayout`, `programmeForm` etc.)
- **Controllers** — functions in `controllers/` that handle requests, query the database, and return responses

Two rendering approaches are used side by side:

- **Server-side rendering** — most pages return a full HTML string built on the server
- **Client-side updates** — the interest registration form in `static/app.js` uses the Fetch API to POST/DELETE to the server and updates the DOM without a page reload

---

## Database schema

```
programmes ──< modules
programmes ──< programme_leaders >── staff
modules    ──< module_leaders    >── staff
programmes ──< student_interests
admins
```

All foreign keys use `ON DELETE CASCADE` so deleting a programme automatically removes its modules, leader assignments, and interest registrations.

---

## License

MIT
