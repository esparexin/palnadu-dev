# Palnadu.dev — Agent Rules

## Mandatory skills

- For ANY UI/UX work (`apps/web/src`, `apps/admin/src`, `packages/ui/src`, `packages/config/tailwind-preset.js`, `tailwind.config.js`, `globals.css`, `layout.tsx`): load skill `palnadu-ui-ux` FIRST via `skill({ name: "palnadu-ui-ux" })` and obey it strictly. If output violates the skill, refuse and fix via tokens.
- SSOT: `packages/config/tailwind-preset.js` (colors, `palnadu-dark-hover`, `palnadu-teal-dark`, `fontFamily.sans/mono`, animations) + `packages/ui/src/globals.css`. Never add tokens in app configs.

## Quick bans (full list in skill)

- No `font-serif`, `font-black`/`900`, `text-[10px]`/`text-[11px]`, `bg-[#...]`/`hover:bg-[#...]`, `rounded-[...]`, `shadow-xs`/`shadow-2xs`/`backdrop-blur-xs`, `dark:` classes, raw `red-*`/`emerald-*`/`purple-*`/`slate-*`/`gray-*`/`zinc-*`/`cyan-*`, hardcoded `#12487e`/`#157c5c`.
- Admin: no raw `<input>`/`<button>`/`<label>` — use `@/components/ui/*` primitives; use `h-9 text-xs rounded-md` fields, `buttonVariants`, `<SectionHeading>` for H2s.

## Permanent Engineering & Code Quality Policy

### 1. Strict Code Hygiene
- No dummy, alien, zombie, dead, legacy, orphaned, culprit, hardcoded, duplicate, redundant, or unnecessary code, files, components, functions, hooks, APIs, routes, services, schemas, or logic.
- No temporary workarounds, placeholder implementations, mock production logic, unused dependencies, or unexplained technical debt.
- Every implementation must have a clear purpose, ownership, dependency path, and actual usage.
- Remove obsolete code only after verifying that nothing depends on it.

### 2. Strict 250-Line File Policy
- Every source code file must contain fewer than 250 lines (maximum 249 lines per file).
- Apply this rule to every newly created or modified file without exceptions.
- Decompose oversized files into logically separated, reusable modules.
- Never bypass the rule by moving excessive code into another oversized file.
- Enforce the policy through automated validation, ESLint, and CI/CD gates.
- Existing violations must be progressively eliminated through dedicated refactoring phases.

### 3. Frontend & Backend Standards
Every change must strictly comply with:
- Established UI/UX standards and design systems.
- Existing architectural patterns and coding conventions.
- Shared packages, interfaces, types, and contracts.
- Single Source of Truth (SSOT) principles.
- API, database, schema, validation, and security standards.
- Dependency management and package boundaries.
- Applicable repository-specific skills, instructions, and documentation.

### 4. Architecture & Implementation Integrity
- Maintain clear separation of concerns and single responsibility.
- Reuse existing shared implementations instead of introducing duplicates.
- Follow established frontend/backend contracts.
- Avoid unnecessary abstractions, dependencies, files, and complexity.
- Preserve existing functionality and backward compatibility unless explicitly authorized.
- Never introduce speculative changes or unrelated modifications.

### 5. Mandatory Pre-Commit Audit
Before every commit:
1. Inspect every changed and newly created file.
2. Verify the strict 249-line maximum.
3. Identify dummy, alien, zombie, dead, legacy, orphaned, culprit, hardcoded, duplicate, and unused code.
4. Verify frontend/backend architecture and shared contracts.
5. Verify SSOT compliance and eliminate conflicting sources of truth.
6. Audit API methods, routes, controllers, services, hooks, schemas, validations, and database interactions where applicable.
7. Verify UI/UX consistency, accessibility, responsiveness, and error handling.
8. Run relevant linting, type checks, tests, builds, and repository quality gates.
9. Review the complete diff for regressions, security issues, and unrelated changes.
10. Resolve all identified violations before committing.

### 6. Phasewise Development & Git Discipline
- Use one dedicated branch for the implementation across multiple phases when requested.
- Keep each phase focused on one clearly defined problem category.
- Audit and validate each phase before committing.
- Use clean, descriptive commit messages.
- Never commit known failing tests, broken contracts, or unresolved quality violations.

### 7. Non-Negotiable Acceptance Criteria
A change is not considered complete until:
- All newly created and modified files comply with the 249-line maximum.
- No prohibited or unnecessary code has been introduced.
- Existing architecture and shared contracts remain consistent.
- All applicable tests and quality gates pass.
- No unintended frontend or backend regressions exist.
- The implementation is production-ready, maintainable, and fully integrated.

### 8. Execution Efficiency & Workflow Discipline
To ensure predictable turnaround without sacrificing engineering rigor:
- **Scoped Builds & Tests:** During active development, use package-scoped builds (`pnpm build:api`, `pnpm build:web`, `pnpm build:admin`) and targeted test files (`node --test apps/api/test/<target>.test.mjs`). Do not invoke full monorepo `pnpm build` or `pnpm test` repeatedly for micro-edits.
- **Milestone Validation (`pnpm gate:all`):** Use `pnpm gate:quick` during rapid iteration. Run comprehensive validation (`pnpm gate:all`) at clearly bounded phase milestones and pre-commit audits. Never skip required quality gates.
- **Proactive Architectural Decomposition:** Monitor the 249-line maximum. When a file approaches 220 lines, proactively extract helpers, types, or constants into distinct modules *before* adding logic. Never engage in single-line trimming loops (`wc -l` ping-pong).
- **Bounded Searches:** Never execute unbounded `grep -rn <term> .` across the repository root. Always use `pnpm search <query>` or explicitly exclude build and cache directories (`--exclude-dir={node_modules,.next,.turbo,dist,.git}`).
- **Task-Scoped Sleep Prevention:** For authorized long-running background tasks, wrap commands with `pnpm sleep:prevent <cmd>` to prevent macOS network sleep and SSE stream disconnection. Normal power states are restored immediately upon exit.
- **Fresh Context & Handover Discipline:** Keep individual PRs and feature phases bounded. When completing a phase, record a concise implementation handover note (decisions made, files changed, tests passed, outstanding tasks) to prevent context bloat and compaction stalls.


