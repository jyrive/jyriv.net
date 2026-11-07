/**
 * The blog, such as it is: every `src/posts/*.md` file, parsed at build time.
 *
 * Only ever imported from `+page.server.js`, so `marked` and the raw markdown
 * stay out of the browser bundle — the prerenderer bakes the finished HTML into
 * the static pages and the site keeps shipping zero runtime dependencies.
 */

import { marked } from 'marked';

/** Raw sources, keyed by path. Vite inlines these at build time. */
const sources = import.meta.glob('/src/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});

/**
 * @typedef {object} Post
 * @property {string} slug
 * @property {string} title
 * @property {string} date     ISO `YYYY-MM-DD`
 * @property {string} summary
 * @property {string[]} tags
 * @property {boolean} draft
 * @property {number} minutes  estimated reading time
 * @property {string} html     rendered body
 */

/**
 * A deliberately small front-matter reader: `key: value` pairs, plus inline
 * `[a, b]` lists. Anything fancier belongs in the body.
 *
 * @param {string} raw
 * @returns {{ meta: Record<string, any>, body: string }}
 */
function parseFrontMatter(raw) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
	if (!match) return { meta: {}, body: raw };

	/** @type {Record<string, any>} */
	const meta = {};
	for (const line of match[1].split(/\r?\n/)) {
		const pair = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
		if (!pair) continue;

		let value = pair[2].trim().replace(/^["'](.*)["']$/, '$1');
		if (/^\[.*\]$/.test(value)) {
			meta[pair[1]] = value
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^["'](.*)["']$/, '$1'))
				.filter(Boolean);
		} else if (value === 'true' || value === 'false') {
			meta[pair[1]] = value === 'true';
		} else {
			meta[pair[1]] = value;
		}
	}
	return { meta, body: raw.slice(match[0].length) };
}

/** @param {string} path @param {string} raw @returns {Post} */
function parse(path, raw) {
	const slug = /** @type {string} */ (path.split('/').pop()).replace(/\.md$/, '');
	const { meta, body } = parseFrontMatter(raw);
	const words = body.split(/\s+/).filter(Boolean).length;

	return {
		slug,
		title: meta.title ?? slug,
		date: meta.date ?? '',
		summary: meta.summary ?? '',
		tags: meta.tags ?? [],
		draft: meta.draft === true,
		minutes: Math.max(1, Math.round(words / 220)),
		html: /** @type {string} */ (marked.parse(body, { async: false, gfm: true }))
	};
}

/** Newest first. Drafts show up in `npm run dev` only. */
function all() {
	return Object.entries(sources)
		.map(([path, raw]) => parse(path, /** @type {string} */ (raw)))
		.filter((post) => import.meta.env.DEV || !post.draft)
		.sort((a, b) => b.date.localeCompare(a.date));
}

/** Index entries — same shape as a post, minus the body. */
export function listPosts() {
	return all().map(({ html, ...rest }) => rest);
}

/** @param {string} slug */
export function getPost(slug) {
	return all().find((post) => post.slug === slug) ?? null;
}
