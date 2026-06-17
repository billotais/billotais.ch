# billotais.ch

Personal website built with [Astro](https://astro.build), deployed to GitHub Pages.

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm (bundled with Node.js)

## Local development

Install dependencies:

```bash
npm install
```

Start the dev server (with hot reload):

```bash
npm run dev
```

The site is available at **http://localhost:4321**.

## Build

Generate the static site into `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The preview server runs at **http://localhost:4321**.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds the site and deploys it to GitHub Pages automatically.

## Adding your CV PDF

Place your CV file at `public/cv.pdf`. The download button on the CV page already points to that path.

## Project structure

```
src/
├── layouts/Layout.astro    # shared nav, footer, SEO meta
├── pages/
│   ├── index.astro         # home / about
│   ├── cv.astro            # inline CV timeline + PDF download
│   └── projects.astro      # project cards
└── styles/global.css       # design tokens and all styles
public/
├── CNAME                   # custom domain
└── favicon.svg
```
