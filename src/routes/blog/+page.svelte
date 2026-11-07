<script>
	import { resolve } from '$app/paths';
	import Masthead from '$lib/Masthead.svelte';
	import { formatDate } from '$lib/format.js';
	import { scenes } from '$lib/scenes/index.js';

	/** @type {{ data: { posts: import('$lib/posts.js').Post[] } }} */
	let { data } = $props();
</script>

<svelte:head>
	<title>Writing — jyriv.net</title>
	<meta name="description" content="Notes on graphics, the web, and things I've been building." />
</svelte:head>

<main>
	<Masthead />

	<section class="intro">
		<h1>Writing</h1>
		<p class="lede">
			Notes on canvas and WebGL, the web platform, and whatever I happen to be building. The
			backdrop keeps running behind — press <kbd>1</kbd>–<kbd>{scenes.length}</kbd> if you want a
			different one.
		</p>
	</section>

	{#if data.posts.length}
		<ul class="posts">
			{#each data.posts as post, i (post.slug)}
				<li style="--i: {i}">
					<a href="{resolve('/blog/[slug]', { slug: post.slug })}/">
						<div class="row">
							<time datetime={post.date}>{formatDate(post.date)}</time>
							<span class="minutes">{post.minutes} min</span>
						</div>
						<h2>{post.title}<span class="go" aria-hidden="true">→</span></h2>
						<p>{post.summary}</p>
						{#if post.tags.length}
							<ul class="tags">
								{#each post.tags as tag (tag)}
									<li>{tag}</li>
								{/each}
							</ul>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Nothing published yet.</p>
	{/if}
</main>

<style>
	main {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		gap: clamp(1.5rem, 4vw, 2.75rem);
		width: min(100%, 46rem);
		margin: 0 auto;
		padding: clamp(0.9rem, 4vw, 3.5rem) clamp(0.9rem, 4vw, 2rem);
		padding-bottom: clamp(6.5rem, 14vw, 9rem);
	}

	.intro {
		max-width: 34rem;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(2.1rem, 7vw, 3.4rem);
		font-weight: 800;
		letter-spacing: var(--tracking);
		line-height: 1.05;
		background: linear-gradient(100deg, var(--fg) 30%, var(--accent) 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.lede {
		margin: 0.85rem 0 0;
		font-size: 1rem;
		line-height: 1.65;
		color: var(--muted);
	}

	/* One sheet with hairline rows, rather than a card per post: it reads as a
	   list, and it costs one backdrop-filter instead of N. */
	.posts {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: var(--card-radius);
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		backdrop-filter: blur(18px) saturate(150%);
		-webkit-backdrop-filter: blur(18px) saturate(150%);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.posts > li + li {
		border-top: 1px solid var(--card-border);
	}

	.posts > li {
		animation: rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 60ms);
	}

	.posts a {
		display: block;
		position: relative;
		padding: clamp(1.1rem, 3vw, 1.7rem) clamp(1.1rem, 3vw, 2rem);
		text-decoration: none;
		color: inherit;
		transition: background 0.2s ease;
	}

	.posts a:hover {
		background: color-mix(in srgb, var(--accent) 9%, transparent);
	}

	.row {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		font-size: 0.72rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--faint);
	}

	.minutes::before {
		content: '·';
		margin-right: 0.6rem;
	}

	h2 {
		margin: 0.55rem 0 0;
		font-family: var(--font-display);
		font-size: clamp(1.2rem, 3.4vw, 1.5rem);
		font-weight: 700;
		letter-spacing: var(--tracking);
		line-height: 1.2;
	}

	.posts a:hover h2 {
		color: var(--accent);
	}

	.posts p {
		margin: 0.5rem 0 0;
		max-width: 34rem;
		font-family: var(--font-prose);
		font-size: 1rem;
		line-height: 1.6;
		color: var(--muted);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		list-style: none;
		margin: 0.9rem 0 0;
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

	.go {
		display: inline-block;
		margin-left: 0.4em;
		color: var(--accent);
		opacity: 0.3;
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	.posts a:hover .go,
	.posts a:focus-visible .go {
		opacity: 1;
		transform: translateX(4px);
	}

	.empty {
		color: var(--muted);
	}

	kbd {
		font: inherit;
		font-size: 0.72rem;
		padding: 0.12rem 0.32rem;
		border-radius: 0.3rem;
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (max-width: 640px) {
		.posts {
			backdrop-filter: blur(9px) saturate(135%);
			-webkit-backdrop-filter: blur(9px) saturate(135%);
		}

		/* No hover on touch — show the affordance outright. */
		.go {
			opacity: 0.6;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.posts > li {
			animation: none;
		}

		.posts a,
		.go {
			transition: none;
		}
	}
</style>
