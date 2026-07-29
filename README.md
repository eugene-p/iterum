# Iterum

Local-first fitness activity analysis: import GPS workouts, define segments, and compare passes over the same route.

## Features

- Import activities from GPX, TCX, KML/KMZ, FIT, Fitlog, and CSV
- Profile-scoped activity and segment libraries
- Segment matching with pass selection and multi-pass compare
- Route maps, track charts, stretch timing, and HR-zone views
- Automatic tags, location labels, and route preview images after import

## Stack

| Area | Tech |
|------|------|
| Frontend | React, Vite, TanStack Query, Leaflet |
| API | Express, TypeScript |
| Database | PostgreSQL |
| Monorepo | npm workspaces (`frontend`, `server`, `packages/shared`) |

## Prerequisites

- Node.js 22+
- npm 10+
- Docker or Podman (for Postgres via Compose)

## Setup

```bash
# Install dependencies
npm install

# Environment (API + DB)
cp .env.example .env

# Start Postgres (Compose uses local user/password/db: iterum)
npm run db:up

# Apply migrations
npm run db:migrate
```

`.env.example` documents `DATABASE_URL`, `PORT` (API default **8181** if unset), `CORS_ORIGINS`, and `JSON_BODY_LIMIT`.

## Development

```bash
# API + Vite frontend together
npm run dev

# Or separately
npm run dev:server
npm run dev:frontend
```

- API: `http://127.0.0.1:8181` (`.env.example` / server default; Vite proxies `/api` here)
- Frontend (Vite): `http://127.0.0.1:5173`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run API and frontend in watch mode |
| `npm run test` | Run frontend and server tests |
| `npm run lint` | ESLint (frontend) |
| `npm run validate` | Lint + frontend tests |
| `npm run prod:build` | Build shared, server, and frontend |
| `npm run start` | Run the compiled server (serves built frontend when present) |
| `npm run db:up` / `db:down` | Start/stop Postgres |
| `npm run db:migrate` | Run database migrations |

Server-only maintenance scripts (from `server/`): `backfill:metadata`, `backfill:stretches`, `backfill:track-metrics`, `backfill:previews`.

## Repository layout

```
frontend/          React app
server/            Express API, parsers, jobs, migrations
packages/shared/   Shared types and API helpers
scripts/           Repo utility scripts
compose.yaml       Postgres service
```

## License

[MIT](LICENSE)
