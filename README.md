# jyriv.net

Personal site — a static SvelteKit app with five interactive backdrops you can
switch between. Each one is hand-written canvas or WebGL, reacts to the cursor,
and brings its own colour palette for the rest of the page.

| # | Scene | What it is |
| - | ----- | ---------- |
| 1 | Flow field | Noise-driven particle streams that curl around the cursor |
| 2 | Plasma | A domain-warped fbm fragment shader (WebGL) |
| 3 | Swarm | Boids with a spatial grid, orbiting the pointer |
| 4 | Outrun | Projected wireframe terrain, neon grid and a banded sun |
| 5 | Car | A hand-built low-poly car on a turntable, flat shaded and painter-sorted |

Switch with the dock at the bottom, the number keys `1`–`5`, or `←`/`→`. The
choice is stored in `localStorage` and mirrored into the URL as `?s=<id>`, so a
link like `jyriv.net/?s=synth` opens on that scene. An inline script in
[`src/app.html`](src/app.html) applies the saved palette before first paint.

## Layout

- [`src/lib/stage.js`](src/lib/stage.js) — shared canvas plumbing: DPR-aware
  sizing, an eased pointer, a rAF loop that idles on hidden tabs, and a short
  "settle then freeze" run for `prefers-reduced-motion`.
- [`src/lib/scenes/`](src/lib/scenes/) — one component per backdrop, plus
  [`index.js`](src/lib/scenes/index.js) which registers them.
- The backdrop, the dock and the keyboard shortcuts live in
  [`+layout.svelte`](src/routes/+layout.svelte), so every route shares one
  running scene. [`scene.svelte.js`](src/lib/scene.svelte.js) holds the choice.
- Palettes live in [`+layout.svelte`](src/routes/+layout.svelte) as CSS custom
  properties keyed on `html[data-scene]`.

To add a scene: drop a component in `src/lib/scenes/`, add it to the registry,
and add a matching `html[data-scene='<id>']` palette block.

Every palette is currently dark, but the values a light one would have to invert
are kept as tokens rather than hardcoded blacks — `--mark`, `--shadow`,
`--shadow-dock`, `--code-bg`. Keep new UI on those and a daylight scene stays a
palette block rather than a refactor.

## Blog

Posts are markdown files in [`src/posts/`](src/posts/). There is no backend and
no CMS: [`src/lib/posts.js`](src/lib/posts.js) globs the folder at build time,
renders it with `marked`, and the prerenderer bakes the result into static HTML.
Neither the markdown nor the renderer reaches the browser.

To publish, add a file and push — the deploy workflow does the rest. GitHub's
own web editor works fine for this if you're away from your laptop.

```markdown
---
title: A post about something
date: 2026-08-11
summary: One or two sentences, shown on the index and in <meta name=description>.
tags: [canvas, graphics]
draft: false
---

Body text.
```

`title` and `date` are the only fields worth caring about; the filename becomes
the slug and reading time is counted from the body. Drafts (`draft: true`) show
up in `npm run dev` and are dropped from the build.

Blog routes dim the backdrop behind a scrim, swap the body face to a serif for
readability, and slide the dock away as you scroll down.

## Tech

- [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- `@sveltejs/adapter-static` — fully prerendered, no server required
- No runtime dependencies — the noise, boids and shaders are all in-repo, and
  `marked` is used at build time only
- Deployed to **GitHub Pages** via GitHub Actions

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs static site to ./build
npm run preview    # serve the production build locally
```

## Deploy

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the site and publishes it to GitHub Pages.

One-time repo setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### Custom domain

The site is configured for the custom domain `jyriv.net`:

- [`static/CNAME`](static/CNAME) contains the domain, copied into the build output.
- The base path is empty (root) in [`svelte.config.js`](svelte.config.js).

In your DNS provider, point the domain at GitHub Pages:

- `A` records for the apex `jyriv.net` → `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- `CNAME` for `www` → `jyrive.github.io`

If instead you serve from `https://jyrive.github.io/jyriv.net/` (no custom
domain), build with `BASE_PATH=/jyriv.net npm run build` and remove
`static/CNAME`.
