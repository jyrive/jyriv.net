# jyriv.net

Personal site — a static SvelteKit app with an interactive, real-time
flow-field particle animation rendered on an HTML5 canvas. Move your cursor and
the particles curl around it.

## Tech

- [SvelteKit](https://kit.svelte.dev/) (Svelte 5)
- `@sveltejs/adapter-static` — fully prerendered, no server required
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
