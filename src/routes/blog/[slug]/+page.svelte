<script>
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import Masthead from '$lib/Masthead.svelte';
	import { formatDate } from '$lib/format.js';

	/**
	 * @type {{ data: {
	 *   post: import('$lib/posts.js').Post,
	 *   newer: import('$lib/posts.js').Post | null,
	 *   older: import('$lib/posts.js').Post | null
	 * } }}
	 */
	let { data } = $props();

	let progress = $state(0);

	function measure() {
		const doc = document.documentElement;
		const max = doc.scrollHeight - window.innerHeight;
		progress = max > 8 ? Math.min(1, Math.max(0, doc.scrollTop / max)) : 0;
	}

	onMount(measure);
</script>

<svelte:head>
	<title>{data.post.title} — jyriv.net</title>
	<meta name="description" content={data.post.summary} />
</svelte:head>

<svelte:window onscroll={measure} onresize={measure} />

<div class="progress" style="--p: {progress}" aria-hidden="true"></div>

<main>
	<Masthead crumb={data.post.title} />

	<article>
		<header>
			<p class="kicker">
				<time datetime={data.post.date}>{formatDate(data.post.date)}</time>
				<span>{data.post.minutes} min read</span>
			</p>
			<h1>{data.post.title}</h1>
			{#if data.post.summary}
				<p class="summary">{data.post.summary}</p>
			{/if}
			{#if data.post.tags.length}
				<ul class="tags">
					{#each data.post.tags as tag (tag)}
						<li>{tag}</li>
					{/each}
				</ul>
			{/if}
		</header>

		<div class="prose">
			<!-- Rendered from markdown at build time by $lib/posts.js. -->
			{@html data.post.html}
		</div>
	</article>

	<nav class="pager" aria-label="More posts">
		{#if data.older}
			<a class="older" href="{resolve('/blog/[slug]', { slug: data.older.slug })}/">
				<span class="dir">← Older</span>
				<span class="what">{data.older.title}</span>
			</a>
		{/if}
		{#if data.newer}
			<a class="newer" href="{resolve('/blog/[slug]', { slug: data.newer.slug })}/">
				<span class="dir">Newer →</span>
				<span class="what">{data.newer.title}</span>
			</a>
		{/if}
	</nav>
</main>

<style>
	/* Reading progress — the one bit of motion that earns its place here. */
	.progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 4;
		transform: scaleX(var(--p, 0));
		transform-origin: 0 50%;
		background: linear-gradient(90deg, var(--accent), var(--accent-2));
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 60%, transparent);
	}

	main {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: clamp(1.25rem, 4vw, 2.25rem);
		width: min(100%, 44rem);
		margin: 0 auto;
		padding: clamp(0.9rem, 4vw, 3.5rem) clamp(0.9rem, 4vw, 2rem);
		padding-bottom: clamp(6.5rem, 14vw, 9rem);
	}

	article {
		padding: clamp(1.25rem, 4vw, 3rem);
		border-radius: var(--card-radius);
		/* Denser than the hero card: text needs a settled ground, not a window. */
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		border: 1px solid var(--card-border);
		backdrop-filter: blur(20px) saturate(140%);
		-webkit-backdrop-filter: blur(20px) saturate(140%);
		box-shadow: var(--shadow);
	}

	.kicker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--faint);
	}

	.kicker span::before {
		content: '·';
		margin-right: 0.6rem;
	}

	h1 {
		margin: 0.7rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(1.85rem, 5.5vw, 2.8rem);
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: var(--tracking);
	}

	.summary {
		margin: 0.9rem 0 0;
		font-family: var(--font-prose);
		font-size: 1.1rem;
		font-style: italic;
		line-height: 1.6;
		color: var(--muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		list-style: none;
		margin: 1.1rem 0 0;
		padding: 0;
	}

	.tags li {
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		color: var(--faint);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	/* ---- Prose ----------------------------------------------------------
	   Everything below styles markdown-generated HTML, so it all has to be
	   :global. The measure is capped in ch so it holds at any font size. */

	.prose {
		margin-top: clamp(1.5rem, 4vw, 2.25rem);
		padding-top: clamp(1.5rem, 4vw, 2.25rem);
		border-top: 1px solid var(--card-border);
		max-width: 68ch;
		font-family: var(--font-prose);
		font-size: 1.075rem;
		line-height: 1.75;
		color: color-mix(in srgb, var(--fg) 90%, transparent);
		overflow-wrap: break-word;
	}

	/* The body always opens with a paragraph or a heading. */
	.prose :global(p:first-child),
	.prose :global(h2:first-child),
	.prose :global(h3:first-child) {
		margin-top: 0;
	}

	.prose :global(p) {
		margin: 1.15em 0;
	}

	.prose :global(h2),
	.prose :global(h3),
	.prose :global(h4) {
		font-family: var(--font-display);
		letter-spacing: var(--tracking);
		line-height: 1.25;
		color: var(--fg);
		/* Headings belong to what follows them. */
		margin: 2.2em 0 0.6em;
	}

	.prose :global(h2) {
		font-size: 1.45em;
		font-weight: 700;
	}

	.prose :global(h3) {
		font-size: 1.15em;
		font-weight: 700;
	}

	.prose :global(h4) {
		font-size: 1em;
		font-weight: 700;
		color: var(--muted);
	}

	.prose :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
		text-decoration-color: color-mix(in srgb, var(--accent) 45%, transparent);
		transition: text-decoration-color 0.18s ease;
	}

	.prose :global(a:hover) {
		text-decoration-color: var(--accent);
	}

	.prose :global(strong) {
		color: var(--fg);
		font-weight: 700;
	}

	.prose :global(ul),
	.prose :global(ol) {
		margin: 1.15em 0;
		padding-left: 1.4em;
	}

	.prose :global(li) {
		margin: 0.4em 0;
	}

	.prose :global(li::marker) {
		color: color-mix(in srgb, var(--accent) 75%, transparent);
	}

	.prose :global(blockquote) {
		margin: 1.6em 0;
		padding: 0.2em 0 0.2em 1.2em;
		border-left: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
		color: var(--muted);
		font-style: italic;
	}

	.prose :global(blockquote p) {
		margin: 0.5em 0;
	}

	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.86em;
		padding: 0.15em 0.4em;
		border-radius: 0.35em;
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	.prose :global(pre) {
		margin: 1.6em 0;
		padding: 1rem 1.15rem;
		border-radius: calc(var(--card-radius) / 2.5);
		background: var(--code-bg);
		border: 1px solid var(--card-border);
		overflow-x: auto;
		line-height: 1.55;
		/* Posts are written with tabs; eight columns of indent is a lot. */
		tab-size: 2;
	}

	.prose :global(pre code) {
		padding: 0;
		border: 0;
		background: none;
		font-size: 0.85em;
		color: var(--fg);
	}

	/* Posts occasionally drop raw <kbd> into the markdown. */
	.prose :global(kbd) {
		font-family: var(--font-body);
		font-size: 0.75em;
		padding: 0.15em 0.4em;
		border-radius: 0.3em;
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	.prose :global(hr) {
		margin: 2.4em 0;
		border: 0;
		border-top: 1px solid var(--card-border);
	}

	.prose :global(img) {
		display: block;
		max-width: 100%;
		height: auto;
		border-radius: calc(var(--card-radius) / 2.5);
	}

	.prose :global(table) {
		width: 100%;
		margin: 1.6em 0;
		border-collapse: collapse;
		font-family: var(--font-body);
		font-size: 0.92em;
	}

	.prose :global(th),
	.prose :global(td) {
		padding: 0.5em 0.7em;
		border-bottom: 1px solid var(--card-border);
		text-align: left;
	}

	.prose :global(th) {
		color: var(--faint);
		font-weight: 600;
		font-size: 0.85em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	/* ---- Pager ---------------------------------------------------------- */

	.pager {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.pager a {
		flex: 1 1 14rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.85rem 1.1rem;
		border-radius: calc(var(--card-radius) / 2);
		text-decoration: none;
		color: var(--fg);
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.pager a:hover {
		transform: translateY(-2px);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.pager .newer {
		text-align: right;
	}

	.dir {
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
	}

	.what {
		font-size: 0.92rem;
		font-weight: 600;
		line-height: 1.3;
	}

	@media (max-width: 640px) {
		article {
			backdrop-filter: blur(10px) saturate(130%);
			-webkit-backdrop-filter: blur(10px) saturate(130%);
		}

		.prose {
			font-size: 1.02rem;
			line-height: 1.7;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pager a {
			transition: none;
		}

		.pager a:hover {
			transform: none;
		}
	}
</style>
