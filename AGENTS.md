# Palnadu.dev — Agent Rules

## Mandatory skills

- For ANY UI/UX work (`apps/web/src`, `apps/admin/src`, `packages/ui/src`, `packages/config/tailwind-preset.js`, `tailwind.config.js`, `globals.css`, `layout.tsx`): load skill `palnadu-ui-ux` FIRST via `skill({ name: "palnadu-ui-ux" })` and obey it strictly. If output violates the skill, refuse and fix via tokens.
- SSOT: `packages/config/tailwind-preset.js` (colors, `palnadu-dark-hover`, `palnadu-teal-dark`, `fontFamily.sans/mono`, animations) + `packages/ui/src/globals.css`. Never add tokens in app configs.

## Quick bans (full list in skill)

- No `font-serif`, `font-black`/`900`, `text-[10px]`/`text-[11px]`, `bg-[#...]`/`hover:bg-[#...]`, `rounded-[...]`, `shadow-xs`/`shadow-2xs`/`backdrop-blur-xs`, `dark:` classes, raw `red-*`/`emerald-*`/`purple-*`/`slate-*`/`gray-*`/`zinc-*`/`cyan-*`, hardcoded `#12487e`/`#157c5c`.
- Admin: no raw `<input>`/`<button>`/`<label>` — use `@/components/ui/*` primitives; use `h-9 text-xs rounded-md` fields, `buttonVariants`, `<SectionHeading>` for H2s.
