## Goal
Turn the ҚМЖ Генератор into a premium, fully-responsive SaaS-grade UI (emerald + gold, keeping the Kazakh educational identity), with a real design system, light/dark/auto theme, and a11y/performance polish — **without breaking any feature** (generation, editing, Word/PDF export, routing, all Kazakh copy).

Hard preservation constraints (verified by reading every file):
- `#qmzh-document` must stay a clean white paper sheet and must NOT be wrapped in `overflow:auto/hidden` (html2canvas clips that → breaks PDF export). So wide tables are fixed with wrapping, not scrollboxes.
- Keep all business logic, ids, the `data-theme` attribute mechanism, dynamic imports for docx/pdf, and every Kazakh string.
- Favicon currently mismatches (purple bolt vs green UI) → regenerate to emerald/gold.

## 1. Design system & globals — `index.css` (rewrite tokens + base)
- Full token set, keyed on `[data-theme='light']` / `[data-theme='dark']`:
  - Emerald primary (`#059669` light / `#10b981` dark) + strong/soft variants; warm gold accent (`#b45309` / `#f0b429`); bg/surface/surface-2; text/text-muted; border; success/warning/error; focus ring.
  - **Paper tokens kept theme-independent & white** (`--paper`, `--rule-line`, `--margin-red`, `--ink`, `--ink-soft`) so the exportable document never changes.
  - 8px spacing scale (`--sp-1`…`--sp-8`), radii (`--r-sm/-/-lg/-xl/-full`), soft shadow scale, type scale.
  - Keep fonts (PT Sans / PT Serif / Yeseva One — all Cyrillic-capable) with `system-ui` fallback.
- Base reset upgrades: `html { overflow-x: hidden }` + `body { overflow-x: hidden; overflow-wrap:anywhere }` (kills horizontal scroll & word/URL overflow globally); responsive base font via `clamp()`; global `:focus-visible` ring; styled scrollbars; reduced-motion kept.
- Breakpoint intent declared for 320/375/425/768/1024/1440.

## 2. Component styles — `App.css` (rewrite, keep all class names that TSX uses)
- **AppBar (sticky, slim):** brand left, centered nav (Генератор/Қолданушы келісімі/Құпиялылық) with `aria-current`, theme toggle right. Desktop shows full nav; <768px collapses to an accessible disclosure (hamburger) with 44px targets. Container max-width ~1200px.
- **Hero** (home only): emerald gradient panel, refined title + kept SVG underline + subtitle, responsive `clamp()` type.
- **Buttons:** `.btn-primary` (emerald, soft shadow, lift on hover), `.btn-secondary` (outline→surface), min-height 44px, focus ring, disabled states. Add `.btn-ghost`.
- **Cards/form:** modern `.lesson-form` card (keep paper feel optional, or surface card with header/dividers); improved field inputs (clear border + focus), 44px chip/toggle targets, full-width submit on mobile.
- **States:** `.status-box` loading (spinner + message), error (icon + retry), empty — all as centered cards.
- **Toolbar:** modern back button + Word/PDF buttons with icons, wraps cleanly on mobile.
- **Document chrome:** keep `.qmzh-document` paper; refine only the non-paper bits. Make document tables overflow-safe: `td/th { overflow-wrap:anywhere; word-break:break-word }`, `.cell-input { min-width:0; width:100% }`, `table-layout:fixed` for tasks/scoring tables (they already declare column %s), shrink padding/font on phones.
- **Footer:** refined multi-row footer (brand + links + © line), kept links.
- **Legal pages:** modern card chrome, back-as-button, clean type hierarchy.
- Full responsive pass at 320/375/425/768/1024/1440 (replaces the single 640px breakpoint).

## 3. Components (logic unchanged, structure/JSX modernized)
- `Layout.tsx`: add "skip to content" link, `<header>/<nav>/<main>/<footer>` landmarks, container.
- `Header.tsx` → split into slim sticky **AppBar + mobile menu** (nav links via react-router `Link`/`NavLink` with active state, theme toggle ≥44px). Hero markup moves to the home page.
- `Footer.tsx`: modernized layout, same links/copy.
- `LessonForm.tsx`: keep all state/validation/logic; add card header, section grouping, lucide icons (optional, tasteful), 44px targets. No behavior change.
- `GeneratorPage.tsx`: add **Hero**; modernize toolbar + loading/error/empty states with lucide icons (ArrowLeft, FileText, Download, Loader2, AlertCircle). Keep async/export/reset logic and dynamic imports exactly.
- `TermsPage.tsx` / `PrivacyPage.tsx`: modernize chrome only; all text untouched.

## 4. Theme — `ThemeContext.tsx`
- Keep API. Add a `matchMedia('(prefers-color-scheme: dark)')` listener so the app **follows OS changes automatically when the user hasn't explicitly chosen** (stored pref still wins). Keeps light/dark/auto semantics.

## 5. Misc
- `index.html`: `theme-color` meta (light/dark), `preconnect` to fonts, keep lang/title/desc. Regenerate `public/favicon.svg` as emerald/gold (brand consistency).

## Non-goals / safety
- No backend, `api.ts`, `types.ts`, scoring/docx/pdf/image utils, or routing changes.
- No removal of features or copy.
- Avoid `oklch`/`color-mix`/filters inside `#qmzh-document` to keep html2canvas reliable; use hex/rgba there.

## Verify at the end
- `cd client && npx tsc -b` (typecheck) and `npm run build` (Vite production build) must pass.
- Static review that no horizontal-scroll source remains and export element/id is intact.