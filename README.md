# Calendar App – Civil Department Scheduler

A full-stack calendar and notification platform built for academic departments. Administrators can create events (quizzes, deadlines, lectures, …), attach resources, and schedule e-mail / in-app reminders that are automatically delivered to students.  Students get a beautiful responsive calendar with instant updates.

---

## Table of contents
1.  [Key features](#key-features)
2.  [Tech stack](#tech-stack)
3.  [Project layout](#project-layout)
4.  [Quick start](#quick-start)
5.  [Environment variables](#environment-variables)
6.  [Database seeding](#database-seeding)
7.  [Available npm scripts](#available-npm-scripts)
8.  [REST API overview](#rest-api-overview)
9.  [Deployment](#deployment)
10. [Contributing](#contributing)
11. [License](#license)

---

## Key features
• **Role-based access** – Admins manage the calendar & notifications while students have read-only access.<br/>
• **Event categories** – _deadline_, _quiz_, or _other_ (extensible).<br/>
• **Rich resources** – Upload files (PDFs, images, ZIPs …) that are linked to an event and served from `/uploads/*`.<br/>
• **Scheduled notifications** – A background task checks pending notifications every minute and sends e-mails (with [Nodemailer](https://nodemailer.com/)) plus in-app toasts.
• **E-mail opt-in/out** – Toggle e-mails via the `EMAIL_NOTIFICATIONS_ENABLED` flag.
• **Responsive UI** – Built with React 18, Tailwind CSS and shadcn/ui components. Works great on mobile & desktop.
• **Shared type-safe schema** – Front-end and back-end both import validation/typing from `shared/schema.ts` (Zod).
• **Pluggable storage** – Memory implementation for demos, MongoDB implementation for production (see `server/mongo-storage.ts`).
• **Single-command dev server** – `npm run dev` launches Express & Vite with hot-reloading for both layers.

---

## Tech stack
### Front-end
* Vite + React 18 + TypeScript
* Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)  
  (Radix primitives)
* Zustand for state management
* TanStack React Query for asynchronous data fetching & caching
* Wouter for SPA routing

### Back-end
* Node.js + TypeScript + Express  
  (served through Vite middleware in development)
* MongoDB (native driver) with optional in-memory fallback
* Drizzle ORM (schema definition only – currently not used at runtime)
* Multer for file uploads
* Nodemailer for e-mail delivery

### Tooling
* Vite & ESBuild for bundling
* TS-X for TypeScript runtime during development
* Jest/Vitest ⚠ (not yet configured – PRs welcome!)

---

## Project layout
```
.
├── client/            # React front-end (Vite root)
│   ├── src/
│   │   ├── components/  # Reusable UI + modals
│   │   ├── pages/       # Route-level screens
│   │   ├── hooks/       # Custom hooks
│   │   ├── store/       # Zustand stores
│   │   └── lib/         # Utilities (API helper, date utils …)
│   └── index.html       # Vite entry template
│
├── server/            # Express API + background jobs
│   ├── routes.ts        # All REST endpoints
│   ├── index.ts         # Server bootstrap (Dev & Prod)
│   ├── mongo.ts         # DB connection helper
│   ├── storage.ts       # In-memory implementation (demo)
│   ├── mongo-storage.ts # MongoDB implementation (prod)
│   ├── seed-*.ts        # DB seed scripts (memory & Mongo)
│   └── middlewares/
│
├── shared/            # Cross-package types (Zod schemas)
│
├── uploads/           # Runtime file uploads (git-ignored)
├── vite.config.ts     # Shared Vite config
├── tailwind.config.ts # Tailwind theme config
└── package.json
```

---

## Quick start
### Prerequisites
* **Node.js ≥ 18** (tested with 20.x)
* **npm** (or pnpm / yarn)
* **MongoDB** running locally or in the cloud (only needed for persistent storage)

```bash
# 1. Clone
$ git clone https://github.com/your-org/calendar-app.git && cd calendar-app

# 2. Install dependencies (root-level monorepo)
$ npm install

# 3. Configure environment
$ cp .env.example .env
# → edit values (see table below)

# 4. Seed database (optional but recommended)
$ npm run seed:mongo   # creates sample admin user + demo events

# 5. Launch dev server (backend + frontend)
$ npm run dev

# 6. Open http://localhost:5001  (port configurable via server/index.ts)
```
You should now see the calendar. Log in via the **admin** account created by the seed script (`admin@example.com` / `admin123`).

---

## Environment variables
Create a `.env` file in the project root.  All variables are optional – defaults will be used when possible – but you'll want to override at least the database & session secret for production.

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | ✓ | Connection string to your MongoDB instance |
| `SESSION_SECRET` | `change-me-in-prod` | ✓ | Used to sign Express sessions |
| `EMAIL_NOTIFICATIONS_ENABLED` | `true` |   | Toggle e-mail delivery of notifications |
| `EMAIL_HOST` | `smtp.gmail.com` | when e-mail enabled | SMTP host |
| `EMAIL_PORT` | `587` | when e-mail enabled | SMTP port (465 for SSL) |
| `EMAIL_USER` | `bot@university.edu` | when e-mail enabled | SMTP user |
| `EMAIL_PASS` | `app-password` | when e-mail enabled | SMTP password or app password |
| `EMAIL_FROM` | `"Calendar App" <bot@university.edu>` | – | Custom **from** header |
| `NOTIFICATION_RECIPIENTS` | (hard-coded array in `server/routes.ts`) | – | Recipients list (feel free to externalise to ENV) |

> **Note** – If `MONGODB_URI` is not set the server falls back to an in-memory store; data will be lost whenever the process restarts.

---

## Database seeding
Two seed scripts ship with the repo:

* `npm run seed:mongo` → executes `server/seed-mongodb.ts`  (creates admin user, 10 demo events, 3 notifications)
* `npm run seed:memory` → runs `server/seed-database.ts`  (for the in-memory store)

Feel free to modify the scripts to better fit your class schedule.

---

## Available npm scripts
| Script | Purpose |
|--------|---------|
| `dev` | Launch Express + Vite in development (hot reload) |
| `build` | Build production assets (bundles client & server to `dist/`) |
| `start` | Start the **production** server (`NODE_ENV=production`) |
| `check` | Type-check with `tsc` |
| `db:push` | Push Drizzle schema migrations (PostgreSQL – experimental) |

---

## REST API overview
_All routes are prefixed with `/api`.  The front-end uses `fetch` with `credentials: "include"` so you can easily test in Postman by enabling cookies._

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth/signup` | Create a new user (admin only – guarded by IP middleware) |
| `POST` | `/auth/login` | Log in, starts session |
| `POST` | `/auth/logout` | Log out |
| `GET`  | `/auth/user` | Current session user (401 if not signed in) |

### Events
| `GET /events` | List all events (sorted by date) |
| `GET /events/:id` | Single event |
| `POST /events` | Create (admin) |
| `PATCH /events/:id` | Update (admin) |
| `DELETE /events/:id` | Delete (admin) |

### Resources
| `POST /events/:id/resources` | Attach file (multipart/form-data) |
| `GET  /resources/:id` | Download file |
| `DELETE /resources/:id` | Delete file |

### Notifications
| `GET /notifications` | List scheduled notifications |
| `POST /notifications` | Schedule a new notification |
| `PATCH /notifications/:id` | Mark as sent |

> The job `checkScheduledNotifications` (see bottom of `server/routes.ts`) runs every minute with `setInterval`.

---

## Deployment
1.  Ensure `MONGODB_URI` and e-mail ENV variables are set.
2.  `npm run build`  – builds client and bundles server into `dist/`.
3.  Copy `dist/` to your server (or use docker).  Example Dockerfile (simplified):
    ```Dockerfile
    FROM node:22-slim AS build
    WORKDIR /app
    COPY . .
    RUN npm ci && npm run build

    FROM node:22-slim
    WORKDIR /app
    COPY --from=build /app/dist ./dist
    COPY package.json package-lock.json ./
    RUN npm ci --omit=dev
    ENV NODE_ENV=production
    EXPOSE 5001
    CMD ["node", "dist/index.js"]
    ```
4.  Point your reverse-proxy (Nginx, Caddy, …) to port **5001**.

---

## Contributing
1. Fork the repository and create your feature branch (`git checkout -b feat/my-feature`).
2. Commit your changes (`git commit -am 'feat: add amazing feature'`).
3. Push to the branch (`git push origin feat/my-feature`).
4. Open a Pull Request – make sure `npm run check` passes and that you have added tests if needed.

### Coding style
* Front-end components live in `client/src/components` or `…/pages`.
* Keep **types** close to the business logic – leverage the shared Zod schema where possible.
* Run `npm run check` before pushing to guarantee type-safety.

---
