# Palnadu.dev

> Start with the problem. We build the solution.

Premium technology company website — monorepo with public marketing site, administrative dashboard, and NestJS REST API.

## Structure

```
apps/web     — Public Next.js 15 website (Tailwind CSS, Plus Jakarta Sans, Lucide)
apps/admin   — Admin Next.js 15 dashboard (Secured CRUD operations)
apps/api     — NestJS REST API (Prisma ORM, MongoDB Atlas, Autonomous Blogging Engine)
packages/    — Shared packages (@palnadu/config, @palnadu/types, @palnadu/validation, @palnadu/ui, @palnadu/eslint-config)
```

## Getting Started

### One-Command Setup & Run

Make the script executable (if not already) and run:

```bash
# Automatically checks envs, validates database connection, and starts all dev servers
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
./run.sh db      # Sync Prisma schema and apply seeds
./run.sh stop    # Stop Docker containers
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** NestJS 10, Prisma ORM, MongoDB (Atlas / local container)
- **Monorepo:** pnpm workspaces + Turborepo
