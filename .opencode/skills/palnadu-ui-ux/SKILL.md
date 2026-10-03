---
name: palnadu-ui-ux
description: Strict Palnadu UI/UX guardian. Enforce Plus Jakarta Sans + JetBrains Mono, token-only colors, standard buttons/inputs/labels/radius/spacing. Use for any web/admin TSX, Tailwind, globals.css change or UI audit.
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  scope: ui-ux-design-system
  ssot: packages/config/tailwind-preset.js + packages/ui/src/globals.css
---

## What I do

I am a STRICT UI/UX gate. I block inconsistent fonts, text scales, colors,
form fields, buttons, radius, shadows, spacing, and animations.
No hand-rolled UI. No hardcoded hex. No arbitrary escape hatches.

## When to use me

Use me BEFORE writing or editing ANY of:
- `apps/web/src/**/*.{tsx,css}` / `apps/admin/src/**/*.{tsx,css}`
- `packages/ui/src/**/*` / `packages/config/tailwind-preset.js`
- `apps/*/tailwind.config.js` / `apps/*/src/app/{layout,globals.css}`
- Any component with `font-*`, `text-*`, `bg-*`, `border-*`, `rounded-*`, `shadow-*`, `h-7|h-8|h-9|h-10|h-11|h-12`, `<input>`, `<button>`, `<label>`, `<textarea>`

If the task touches UI, load me first. If output violates me, refuse and fix.

## SSOT (read these first)

1. `packages/config/tailwind-preset.js` — colors, fonts, hover tokens, animations
2. `packages/ui/src/globals.css` — CSS vars, `--radius:0.5rem`
3. `apps/web/src/components/ui/button.tsx` — `buttonVariants` (canonical)
4. `apps/web/src/components/ui/{input,label,textarea,checkbox}.tsx` — field canonical
5. `apps/web/src/components/layout/section-heading.tsx` — H2 + eyebrow canonical
6. `apps/web|admin/src/app/layout.tsx` + `globals.css` — font loading + base

Do NOT invent a new token in an app config. Add it to the preset, then consume it.

## 1. FONTS — only 2 families

- Sans: `Plus_Jakarta_Sans` via `font-sans` / `var(--font-sans)`. Both apps MUST load it with `weight:['400','500','600','700','800']`.
- Mono: `JetBrains_Mono` via `font-mono` / `var(--font-mono)`. BOTH apps must load it with `weight:['400','500','700']` and BOTH configs must declare `fontFamily.mono`. Admin currently broken — fix, don't work around.
- NEVER: `font-serif`, `Inter`, `Poppins`, `Manrope`, `Outfit`, `Geist`, `style={{fontFamily:...}}`, `font-[...]`.

## 2. TEXT — fixed scale, no sprawl

Max weight is `font-extrabold` (800). `font-black` / `900` / `fontWeight:900` is FORBIDDEN until layouts load `900`. Same for mono bold beyond `700`.

Allowed patterns only:

| Role | Class (exact) | Notes |
|---|---|---|
| H1 marketing | `text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.12] tracking-tight text-palnadu-dark` | One scale. No `clamp()`, no `text-[16vw]`, no inline `fontSize` |
| H1 admin | `text-2xl font-extrabold tracking-tight text-palnadu-dark` | All dashboard pages identical |
| H2 section | Use `<SectionHeading>` ONLY: `text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight` | Do not hand-write H2s |
| Eyebrow | `text-xs font-mono font-bold uppercase tracking-widest text-palnadu-blue` | Canonical from `section-heading.tsx:27` |
| Body | `text-sm sm:text-base text-palnadu-body leading-relaxed` | `p` defaults to `line-height:1.7` in web base |
| Caption/micro | `text-xs text-palnadu-secondary` | `text-[10px]` / `text-[11px]` / `text-[15px]` FORBIDDEN — use `text-xs` + `tracking-wide` if smaller look needed |
| Code/meta | `font-mono text-xs` | Requires mono font loaded (see §1) |

Banned: `text-2xl sm:text-2xl` (duplicate breakpoint), `leading-[120%]/[100%]`, `tracking-tight` on body, `prose` in admin (no typography plugin), `font-serif ... Aa` TypeTester leftovers (`bento-grid-01.tsx:20`).

## 3. COLORS — tokens only

SSOT hexes ONLY:
`#042C53 #185FA5 #1D9E75 #E6F1FB #F1EFE8 #FFFFFF #5F5E5A #888780 #D3D1C7 #D84040 #F59E0B`
Hover tokens: `palnadu-dark-hover #12487E`, `palnadu-teal-dark #157C5C`.

Use: `text-palnadu-dark|body|secondary|blue|error`, `bg-palnadu-blue|teal|light-blue|off-white|white`, `border-palnadu-border`, `placeholder:text-palnadu-secondary/70`.

FORBIDDEN (reject + replace):
- `bg-[#...]`, `text-[#...]`, `border-[#...]`, `hover:bg-[#12487e]`, `hover:bg-[#157c5c]`, `style={{color:...}}`, `textShadow`
- Raw palette: `red-*`, `emerald-*`, `purple-*`, `slate-*` (except `slate` in demo `hero-parallax` — migrate to palnadu), `gray-*`, `zinc-*`, `cyan-*` (incl. `hero-mesh rgba(6,182,212,0.15)`), `amber-*`, `yellow-*`, `blue-*`
- Off-system darks: `#020b18 #091527 #041E3A #0b2447 #FAFCFF #F5F8FC #222222 #6C6C6C #202124 #1a0dab #4d5156`, `rounded-[30px]` one-offs
- Mixed alphas: pick ONE — `border-palnadu-border/60`, `bg-palnadu-off-white/50`, placeholder `/70`. No `/40` variants.
- Semantic mapping: error=`palnadu-error`, success=`palnadu-teal`, warning=`palnadu-warning`, info=`palnadu-blue`. Never `red-600/700`, `emerald-600`, `purple-600`, `bg-red-50 border-red-300 text-red-800` mixes.

## 4. FORM FIELDS — one dense system

Never raw `<input>/<label>/<textarea>` in admin. Import from `@/components/ui/*` (web canonical, to be promoted to `@palnadu/ui`). Never override with `className="... h-8 text-xs"` on top of `Input` — fix the primitive instead.

| Element | Required class core |
|---|---|
| Label | `text-xs font-semibold text-palnadu-dark leading-none` (both apps; login `text-sm` must shrink to `text-xs`) |
| Input | `flex h-9 w-full rounded-md border border-palnadu-border bg-background px-3 py-1.5 text-xs ring-offset-background placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50` |
| Textarea | Same as input + `min-h-[80px] py-2` (no bare `p-2.5` without `min-h`) |
| Error | `text-[11px] font-medium text-palnadu-error` + field `border-palnadu-error focus-visible:ring-palnadu-error`; box `border-palnadu-error/30 bg-red-50` — wait, `bg-red-50` banned → use `bg-palnadu-error/5 border-palnadu-error/30` |
| Search | `rounded-md pl-9 pr-3 py-1.5 text-xs placeholder:text-palnadu-secondary/70` (web `rounded-lg pl-10 pr-24 shadow-2xs` must conform) |
| Stack | `space-y-1.5` field stack, `gap-2` row actions. No `space-y-0.5/1/3/3.5/4` variants for same pattern |

Banned: `h-7`, `h-8`, `h-10`, `h-11`, `h-12` on inputs; `focus-visible:ring-1`; global `input:focus{box-shadow...}` in `web/globals.css:126-136` double-ringing with Tailwind `ring-2` — delete the CSS reset or align to ring token. Placeholder MUST be `/70`, never solid or `muted-foreground` mix.

## 5. BUTTONS — `buttonVariants` or reject

Canonical `apps/web/src/components/ui/button.tsx` (after dedupe: DELETE `teal`, keep `secondary`):

- base: `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:ring-2 ... disabled:opacity-50` + ALWAYS add `cursor-pointer`
- variants: `default:bg-palnadu-blue hover:bg-palnadu-dark-hover shadow-sm`, `destructive:bg-palnadu-error hover:bg-red-700`, `outline:border-palnadu-blue text-palnadu-blue hover:bg-palnadu-light-blue`, `secondary:bg-palnadu-teal hover:bg-palnadu-teal-dark shadow-sm`, `ghost`, `link`
- sizes: `default:h-10 px-4 py-2`, `sm:h-9 px-3`, `lg:h-11 px-8 text-base`, `xl:h-12 px-10 text-base`, `icon:h-10 w-10`

Rules:
- NEVER hand-roll `<button className="bg-palnadu-blue ...">`. Use `<Button variant size>`.
- Radius `rounded-md` ONLY. `rounded-lg` / `rounded-full px-7 py-3.5 shadow-xl hover:scale-105` hero pills and `h-12 rounded-full` CTAs must map to `lg`/`xl` unless explicitly a pill component.
- Shadow `shadow-sm` for buttons, `shadow-md/lg` for cards. `shadow-xs`, `shadow-2xs`, `backdrop-blur-xs` FORBIDDEN on Tailwind v3 (no-op) — replace with `shadow-sm` / `backdrop-blur-sm`.
- One danger color: `confirm-dialog` `bg-red-600` → `bg-palnadu-error`. One success: `bg-emerald-600`, `bg-purple-600` → `secondary`/`default`.

## 6. RADIUS / SPACING / ANIMATION / DARK

- Radius: buttons/inputs `rounded-md`, search `rounded-md`, cards/modals `rounded-xl`, landing feature cards `rounded-2xl` max, pills/avatars `rounded-full` only. Ban `rounded-[30px]`, `rounded-3xl`.
- Container: web responsive `1rem/1.5rem/2rem` wins; admin flat `1.5rem` must adopt it. Cards `p-6`, modals `p-6`, toasts `p-3.5` — no `p-4 sm:p-6 lg:p-7` drift for same component.
- Animations live in preset ONLY. Admin `animate-fade-in` / `animate-slide-up` currently undefined → no-op. Either import preset animations or remove the classes.
- `darkMode:'class'` + `dark:bg-zinc-900` FORBIDDEN until `.dark{...}` vars + toggler exist. No new `dark:` classes.

## Mandatory workflow

1. **Read** preset + `button.tsx` + `input/label/textarea.tsx` + `section-heading.tsx` before coding.
2. **Grep bans** before finishing (ripgrep):
   `font-serif|font-black|text-\[10px\]|text-\[11px\]|bg-\[#[0-9a-fA-F]|hover:bg-\[#|rounded-\[|shadow-2?xs|backdrop-blur-xs|dark:|red-600|emerald-600|purple-600|slate-700|gray-400|zinc-900|cyan-400|#12487e|#157c5c|#020b18|fontFamily`
   Zero hits required. If a hit is a legit exception (e.g. Google-mimic preview), comment `// ui-ux-exception: <reason>` and get human approval.
3. **Fix via tokens**, never via new arbitrary values. New color/spacing/animation → add to `tailwind-preset.js` first.
4. **Verify**: `pnpm --filter @palnadu/config test` (if present), `pnpm -r typecheck` / `tsc --noEmit`, and visually check `h-9` fields, `rounded-md` buttons, `SectionHeading` H2, mono eyebrow renders in BOTH web + admin.

## Refusal script

If asked to add a hardcoded hex, new font, `font-black`, `rounded-[...]`, raw `<input>` in admin, or `dark:` variant:
> Rejected by `palnadu-ui-ux`: use `<token/component>` instead — `<exact replacement>`. Add new tokens to `packages/config/tailwind-preset.js` if truly new.
