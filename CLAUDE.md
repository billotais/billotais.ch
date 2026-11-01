# billotais.ch

Personal site of Loïs Bilat (Senior Data & AI Engineer). Astro 4 static site, deployed to GitHub Pages
(`.github/workflows/deploy.yml` on push to `main`, custom domain via `public/CNAME`).

## Commands

- `npm run dev` – dev server on http://localhost:4321
- `npm run build` – static build into `dist/` (use it to check changes; there is no `astro check` set up)
- `npm run sync` – regenerate `src/data/*.json` from the Obsidian vault (`scripts/sync-vault.mjs`)
- `npm run build:all` – sync then build
- `npm run trakt-auth`, `npm run import-gpx` – helpers for TV shows (Trakt/TMDB) and race routes (GPX)

## Structure

- `src/pages/` – `index.astro` (home), `cv.astro`, `projects.astro`, `gaming.astro`, `blog/`, `collections/*`
  (tv-shows, races, vinyls, board-games, video-games, teas, books). `/collections` redirects to `/`.
- `src/layouts/Layout.astro` – nav (sticky gradient bar), footer, SEO meta, theme toggle. LinkedIn and GitHub
  icon links (filled, borderless `.nav-icon`) sit in `.nav-actions` next to the dark-mode toggle on every page.
- `src/components/Icon.astro` – inline Lucide-style icons by name (add new paths to its `paths` map).
- `src/styles/global.css` – design tokens (`--color-*`, light and `[data-theme="dark"]`) and shared styles.
- `src/data/*.json` – generated collection data (don't hand-edit; edit the vault and run `npm run sync`),
  except `featured.json` (hand-picked board game slugs for the home page) and `routes.json` (race SVG routes
  made from `src/data/activities/*.gpx`).
- `src/content/posts/` – blog posts (markdown).

## Conventions

- 4-space indentation in `.astro` files, Prettier formatting (`npx prettier --write <file>`).
- Page-specific CSS lives in the page's scoped `<style>`; shared things go in `global.css`.
- Keep the site working without JS and honour `prefers-reduced-motion` for animations.
- Wrap `localStorage` access in try/catch.

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
- **Removed on purpose:** the "View CV" / LinkedIn / GitHub buttons in the hero (redundant with the nav), the
  accordion and chips versions of the career block, the green/white "live" dot next to the date.
- **"Beyond work":** white section below the band with four cards (TV shows, races, board games, vinyls) and
  pills for video games and teas. TV picks = latest watched rated 9+; board games from `featured.json`; vinyls
  marked `favorite` in the vault; races = latest finished plus the next upcoming one.

Ideas that were discussed but not done: moving "Full CV →" directly under the timeline, a softer fade at the
bottom edge of the band, enlarging the TV poster thumbnails so the TV card has no empty space.

## Content notes

- Public CV facts live in `src/pages/cv.astro` (experience, education, skills, certifications, talk at Microsoft
  Ignite Switzerland 2024). The home page numbers (6+ years, 20+ client projects) were given by the owner.
- Main client domains: manufacturing, pharma and public sector (not stated on the home page).
