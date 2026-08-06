# jyriv.net

Personal site — a static SvelteKit app with five interactive backdrops you can
switch between. Each one is hand-written canvas or WebGL, reacts to the cursor,
and brings its own colour palette for the rest of the page.

| # | Scene | What it is |
| - | ----- | ---------- |
| 1 | Flow field | Noise-driven particle streams that curl around the cursor |
| 2 | Plasma | A domain-warped fbm fragment shader (WebGL) |
| 3 | Swarm | Boids with a spatial grid, orbiting the pointer |
| 4 | Terminal | Phosphor glyph rain that runs hot under the cursor, plus CRT scanlines |
| 5 | Outrun | Projected wireframe terrain, neon grid and a banded sun |

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
- Palettes live in [`+layout.svelte`](src/routes/+layout.svelte) as CSS custom
  properties keyed on `html[data-scene]`.

To add a scene: drop a component in `src/lib/scenes/`, add it to the registry,
and add a matching `html[data-scene='<id>']` palette block.

## Tech

- [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- `@sveltejs/adapter-static` — fully prerendered, no server required
- No runtime dependencies — the noise, boids and shaders are all in-repo
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
