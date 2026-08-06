import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// With a custom domain (jyriv.net) the site is served from the root, so the
// base path is empty. If you ever serve from https://<user>.github.io/<repo>/
// instead, set BASE_PATH="/jyriv.net" in the build environment.
const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base
		}
	}
};

export default config;
