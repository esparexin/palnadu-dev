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

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm db:generate
pnpm db:push
pnpm dev
```

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Three Fiber
- **Backend:** NestJS, Prisma, PostgreSQL
- **Monorepo:** pnpm + Turborepo
