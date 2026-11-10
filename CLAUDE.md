# billotais.ch

Personal site of Loïs Bilat (Senior AI Engineer). Astro 7 static site (Node 22+), deployed to GitHub Pages
(`.github/workflows/deploy.yml` on push to `main`, custom domain via `public/CNAME`).

## Commands

- `npm run dev` – dev server on http://localhost:4321
- `npm run build` – static build into `dist/` (use it to check changes)
- `npm run check` – `astro check` + `svelte-check` (types in `.astro`/`.ts`/`.svelte`)
- `npm test` – vitest (currently the gaming scoring)
- `npm run sync` – regenerate `src/data/*.json` from the Obsidian vault (`scripts/sync-vault.mjs`)
- `npm run build:all` – sync then build
- `npm run trakt-auth`, `npm run import-gpx` – helpers for TV shows (Trakt/TMDB) and race routes (GPX)

## Structure

- `src/pages/` – `index.astro` (home), `cv.astro`, `projects.astro`, `elca-gaming.astro` (`/gaming` redirects to it, see `astro.config.mjs`; its data is in `public/elca-gaming/`, gated in the `Caddyfile`), `blog/`, `collections/*`
  (tv-shows, races, vinyls, board-games, video-games, teas, books). `/collections` redirects to `/`.
- `src/layouts/Layout.astro` – nav (sticky gradient bar), footer, SEO meta. The Collections
  dropdown shows each collection's icon. The footer has © on the left and the LinkedIn / GitHub icons on the right
  (not in the nav).
- `src/views/` – the real page bodies, shared by both languages (same tree as `src/pages/`). `src/pages/<x>.astro` and
  `src/pages/fr/<x>.astro` are 3-line wrappers that render the same view; `login`, `profile` and `secret` have no
  French version (`<Layout noLang>`).
- `src/i18n/index.ts` – `getLang(Astro.url)`, `localePath(lang, "/cv")`, `altPath`, `dateLocale`, and `ui` (shared
  strings: nav, collection names, "View all"…).
- `src/components/Icon.astro` – inline Lucide-style icons by name (add new paths to its `paths` map).
- `src/styles/global.css` – design tokens (`--color-*`; light only, there is no dark mode) and shared styles.
- `src/data/*.json` – generated collection data (don't hand-edit; edit the vault and run `npm run sync`),
  except `featured.json` (hand-picked board game slugs for the home page) and `routes.json` (race SVG routes
  made from `src/data/activities/*.gpx`).
- `src/content/posts/` – blog posts (markdown); collection defined in `src/content.config.ts` (glob loader, `post.id` is the slug).

## Conventions

- 4-space indentation in `.astro` files, Prettier formatting (`npx prettier --write <file>`).
- Page-specific CSS lives in the page's scoped `<style>`; shared things go in `global.css`.
- Keep the site working without JS and honour `prefers-reduced-motion` for animations.
- Wrap `localStorage` access in try/catch.

## Login / profile

- `login.astro` and `profile.astro` share the centered card styles `.auth*` in `global.css` (lock icon, full-width
  button, avatar with a user-icon fallback on the profile). English only (`<Layout noLang>`).

## Gaming page (`/elca-gaming`)

- A Svelte island (`src/components/gaming/`: `Gaming` = tabs/loading/error, `Stats`, `Leaderboard` with the score
  tooltip, `SessionList`) rendered by `src/views/elca-gaming.astro`, which only holds the EN/FR texts (`GamingText`).
- Logic is plain TypeScript in `src/gaming/`: `types.ts`, `scoring.ts` (the formulas, covered by `scoring.test.ts`),
  `format.ts`, and `store.ts`. The page only talks to the `GamingStore` interface; today `jsonStore` reads
  `public/elca-gaming/<year>.json` (made from the CSVs by `node scripts/csv-to-json.mjs`).
- Foundation for adding games from the page: write another `GamingStore` (e.g. calling a small API behind the same
  Caddy gate), add `add()`/`remove()` to the interface (`Session.id` is the key) and a form component. Scoring is
  year-dependent (2026+ formula differs), keep that in `scoring.ts` and extend its tests.

## Languages (English + French)

- English lives at the plain paths, French under `/fr/` (same page names). The language is read from the URL
  (`getLang(Astro.url)`), so views take no prop.
- Page text sits in the view's frontmatter as `{ en: ..., fr: ... }` objects (`const text = {...}[lang]`); shared
  strings are in `ui` in `src/i18n/index.ts`. Every internal link goes through `localePath(lang, path)`.
  Script strings reach client code through `data-*` attributes (see `board-games`, `elca-gaming`, `RaceCountdown`).
- Translated: nav, footer, home, CV, projects, blog index and all collection pages. Not translated (data, kept as is):
  names/titles from `src/data/*.json`, blog post bodies (`/fr/blog/<slug>` shows the English post with a note).
- Footer has an `EN · FR` switch (plain links to the same page in the other language). Persistence: clicking it saves
  `lang` in `localStorage`; a `/fr/` page saves `fr`; an English page with a saved `fr` redirects to its French twin
  from an inline script in `<head>` (pages with `noLang` never redirect).
- `/fr/elca-gaming` has its own gate in the `Caddyfile` (no `# title:`, `/profile` skips `/fr/` entries).
- Adding a page: put it in `src/views/`, add the two wrappers, translate its text, check both with `npm run build`.

## Home page (`src/pages/index.astro`)

Decisions taken while redesigning it, so they aren't re-litigated:

- **Intro band:** a full-width gradient block directly under the nav. It uses `linear-gradient(90deg, hero-from,
  hero-to)`, the same as `.nav` in `global.css`, so the two read as one block with no seam (keep them in sync).
  The band is painted by `.intro::before` (100vw wide, `isolation: isolate`) so it can break out of `.container`.
  Text inside is white or soft white (`rgba(255,255,255,.85–.88)`).
- **Left column:** role label, lead sentence, short bio, and two animated stats (`6+` years in industry, `20+`
  client projects). The stats count up from 0 on load (`data-count` / `data-suffix` + small script); the final
  value is in the HTML for no-JS and reduced motion. The bio avoids repeating the career column and does not
  name industries.
- **Right column ("Career"):** a two-entry timeline (ELCA "Since 2020" with the role, EPFL "2015 – 2020"),
  dates on the right of the line, hollow dots, the current entry filled and pulsing (`live-pulse`). "Since 2020"
  is the chosen way to show it is ongoing. The line is drawn in pieces (lead-in above the first dot, connector to
  the next dot, short tail below the last) and the dots are positioned by hand, so re-check alignment if font
  sizes change. The data is the `career` array in the frontmatter; "Full CV →" sits right under the timeline, aligned with the dates. The ELCA keywords line was removed because it repeated the bio.
- **Social icons:** LinkedIn and GitHub are white icons to the right of the stats, after a thin vertical divider
  (chosen over under the stats, next to the role, under "Full CV", and text links in the bio).
- **Removed on purpose:** the "View CV" / LinkedIn / GitHub buttons in the hero (replaced by the icons above), the
  accordion and chips versions of the career block, the green/white "live" dot next to the date.
- **"Beyond work":** white section below the band with four cards (TV shows, races, board games, vinyls) and
  pills for video games and teas. TV picks = latest watched rated 9+; board games from `featured.json`; vinyls
  marked `favorite` in the vault; races = latest finished plus the next upcoming one.

Ideas that were discussed but not done: moving "Full CV →" directly under the timeline, a softer fade at the
bottom edge of the band, enlarging the TV poster thumbnails so the TV card has no empty space.

## Collections notes

- **Vinyls:** `year` (original release year) and `genre` (one broad genre: Rock, Alternative, Pop, Soundtrack…) come
  from the vault notes. The sort chips (artist / year by decade / genre) are client-side, hidden without JS, and the
  choice is saved in `localStorage` (`vinyl-sort`). The `.chips .chip` styles are shared in `global.css`.
- **Races:** `npm run import-gpx` writes per race the SVG thumbnail, `ll` (lat/lon for the map) and `prof`
  (`[km, m, lat, lon]` every 100 m, smoothed). `gain`/`loss` come from the smoothed profile, not the raw GPS
  elevation (raw summing counted noise as climbing). Cards that have a route open a `<dialog>` (Leaflet map +
  elevation profile) in the race's status colour. An overview map of all routes was tried and removed. Tiles: Esri World Light Gray Base (no key), tinted with a
  CSS filter. CARTO now requires a key, and swisstopo's grey map looked too busy at these zooms.

## Content notes

- `src/pages/cv.astro` opens with LinkedIn / GitHub pill links; the job title ("Senior AI Engineer") under the nav is
  shown larger, bold, in the accent colour.
- Public CV facts live in `src/pages/cv.astro` (experience, education, skills, certifications, talk at Microsoft
  Ignite Switzerland 2024). The home page numbers (6+ years, 20+ client projects) were given by the owner.
- Main client domains: manufacturing, pharma and public sector (not stated on the home page).
