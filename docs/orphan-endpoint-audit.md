# Orphan Endpoint Lifecycle Audit (evidence-based, no speculative UI)

> Rule: do not build UI merely because an endpoint exists; do not delete
> an endpoint merely because current UI doesn't consume it. Trace
> controller → service → DB → producers/consumers → jobs → product flow,
> then classify. Verified 2026-10-03 on `fix/ui-ux-ssot-backend-wiring`.

## Classification

| Endpoint | Producer / Consumer | Classification | Action |
|---|---|---|---|
| `GET /api/admin/notifications`, `GET .../unread-count`, `PATCH .../:id/read` | Produced on lead create (`leads.service.ts:14-21`); zero UI consumers | **required-and-wire (future)** | Documented; no bell built in this change (needs product spec for placement/polling). Do not delete — data is being written. |
| `GET /api/admin/automation/sources`, `GET .../coverage`, `POST .../discover`, `GET .../audit-log`, `GET/PATCH .../bilingual` | Automation pipeline; admin wires only `status/generate/keywords/settings` | **intentionally-backend-only (pipeline)** | Retained; wire only when product flow requires. |
| `POST /api/admin/blog/link-translations` | Bilingual rollout tooling | **intentionally-backend-only (tooling)** | Retained; fixed wrong 400→404 status misuse (now `BadRequestException`). |
| `POST /api/admin/blog/categories` | No UI caller (categories read-only in UI) | **required-and-wire (future) or legacy** | Retained; needs product decision — category creation currently impossible from UI. |
| `GET /api/admin/media/:id`, `POST /api/admin/media` (JSON), `PATCH /api/admin/media/:id` | UI uses list/upload/delete only | **intentionally-backend-only (record API)** | Retained; PATCH now Zod-validated. |
| `GET /api/admin/settings/branding` | UI calls public `GET /api/settings/branding` instead | **legacy-duplicate (retain)** | Retained; admin alias harmless. Do not delete without consumer migration proof. |
| `POST/DELETE /api/admin/settings/branding/logo` | Helpers defined `admin/src/lib/api.ts:236-254`, never invoked | **legacy-alias (retain)** | Retained; canonical path is `asset/:type`. Delete only after grep-proof + major version. |
| `GET /api/health` | Infra/probes | **intentionally-backend-only** | Retained. |
| `ogImage` asset type | Supported backend + `lib/api`, previously no UI | **required-and-wired (this change)** | 4th settings card added. |
| Case-Studies CRUD | Backend + client existed, UI missing | **required-and-wired (this change)** | Full Admin CRUD built. |

## Notes

- `ContactSubmission` type (`packages/types`) has no route by design (uses `POST /api/leads`).
- No `DELETE /api/admin/users` exists — correct, no UI removed.
