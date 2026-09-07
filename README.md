# Palnadu.dev

> Start with the problem. We build the solution.

Premium technology company website — monorepo with public site, admin dashboard, and API.

## Structure

```
apps/web     — Public Next.js website
apps/admin   — Admin Next.js dashboard
apps/api     — NestJS REST API
packages/    — Shared packages (ui, types, validation, config, eslint-config)
```

## Getting Started

### One-Command Setup & Run

Make the script executable (if not already) and run:

```bash
# Automatically checks envs, starts PostgreSQL/Redis in Docker, syncs DB & seed, and starts all apps
./run.sh

# Or via pnpm
pnpm dev:all
```

### One-Command Production Build

```bash
# Automatically generates Prisma client and builds all apps/packages
./run.sh build

# Or via pnpm
pnpm build:all
```

### Other Helpful Commands

```bash
./run.sh test    # Run automated tests across the workspace
./run.sh db      # Start database & run Prisma migrations/seeds only
./run.sh stop    # Stop Docker database containers
```

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Three Fiber
- **Backend:** NestJS, Prisma, PostgreSQL
- **Monorepo:** pnpm + Turborepo
