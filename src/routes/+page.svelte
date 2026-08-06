<script>
	import { onMount } from 'svelte';
	import SceneSwitcher from '$lib/SceneSwitcher.svelte';
	import { scenes, resolveScene, STORAGE_KEY } from '$lib/scenes/index.js';

	const links = [
		{ label: 'GitHub', href: 'https://github.com/jyrive' },
		{ label: 'Email', href: 'mailto:jyrive@gmail.com' }
	];

	const tags = ['Web', 'Mobile', 'Data', 'AI'];

	let current = $state(scenes[0].id);
	let mounted = $state(false);
	let tiltX = $state(0);
	let tiltY = $state(0);

	const active = $derived(resolveScene(current));

	onMount(() => {
		const fromUrl = new URLSearchParams(location.search).get('s');
		let stored = null;
		try {
			stored = localStorage.getItem(STORAGE_KEY);
		} catch {
			// Private browsing — the default scene is fine.
		}
		current = resolveScene(fromUrl ?? stored).id;
		mounted = true;
	});

	// Keep the palette, the stored preference and the shareable URL in step.
	$effect(() => {
		if (!mounted) return;
		document.documentElement.setAttribute('data-scene', current);
		try {
			localStorage.setItem(STORAGE_KEY, current);
		} catch {
			// Ignore — persistence is a nicety, not a requirement.
		}
		const url = new URL(location.href);
		url.searchParams.set('s', current);
		history.replaceState(history.state, '', url);
	});

	/** @param {number} delta */
	function step(delta) {
		const i = scenes.findIndex((s) => s.id === current);
		current = scenes[(i + delta + scenes.length) % scenes.length].id;
	}

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		const target = e.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
		) {
			return;
		}

		const n = Number(e.key);
		if (Number.isInteger(n) && n >= 1 && n <= scenes.length) {
			current = scenes[n - 1].id;
			e.preventDefault();
		} else if (e.key === 'ArrowRight') {
			step(1);
			e.preventDefault();
		} else if (e.key === 'ArrowLeft') {
			step(-1);
			e.preventDefault();
		}
	}

	/** @param {MouseEvent} e */
	function onMousemove(e) {
		tiltY = (e.clientX / window.innerWidth - 0.5) * 8;
		tiltX = (0.5 - e.clientY / window.innerHeight) * 6;
	}
</script>

<svelte:head>
	<title>jyriv.net — Jyri</title>
	<meta
		name="description"
		content="Jyri — experimenting across web, mobile, data and AI. Five interactive canvas and WebGL backdrops you can switch between."
	/>
</svelte:head>

<svelte:window onkeydown={onKeydown} onmousemove={onMousemove} />

{#if mounted}
	{#key active.id}
		{@const Backdrop = active.component}
		<Backdrop />
	{/key}
{/if}

<main style="--tilt-x: {tiltX}deg; --tilt-y: {tiltY}deg">
	<header>
		<span class="mark">jyriv.net</span>
		<span class="hint">
			Press <kbd>1</kbd>–<kbd>{scenes.length}</kbd> or <kbd>←</kbd><kbd>→</kbd> to change the backdrop
		</span>
	</header>

	{#key current}
		<section class="hero">
			<h1>
				<span class="line" style="--i: 0">Hi, I'm <em>Jyri</em>.</span>
				<span class="line" style="--i: 1">I build things across</span>
				<span class="line" style="--i: 2"><em>web, mobile, data &amp; AI</em>.</span>
			</h1>

			<p class="lede" style="--i: 3">
				I like making things and following curiosity wherever it leads — from web and mobile
				apps to data pipelines and AI experiments. This page is one of those experiments:
				every backdrop below is hand-written canvas or WebGL, running live.
			</p>

			<ul class="tags" style="--i: 4">
				{#each tags as tag (tag)}
					<li>{tag}</li>
				{/each}
			</ul>

			<nav class="links" style="--i: 5" aria-label="Elsewhere">
				{#each links as link (link.href)}
					<a href={link.href} target="_blank" rel="noreferrer noopener">
						{link.label}
						<span aria-hidden="true">→</span>
					</a>
				{/each}
			</nav>

			<p class="colophon" style="--i: 6">SvelteKit · hand-written canvas &amp; WebGL</p>
		</section>
	{/key}
</main>

<SceneSwitcher {scenes} {current} onselect={(id) => (current = id)} />

<style>
	main {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: clamp(0.9rem, 4vw, 3.5rem);
		/* Only needs to clear the switcher dock — anything more is wasted height. */
		padding-bottom: clamp(6.25rem, 12vw, 7.5rem);
		pointer-events: none;
	}

	header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1.5rem;
		font-size: 0.75rem;
		color: var(--faint);
		/* The busier backdrops sit directly behind this row. */
		text-shadow: 0 1px 10px var(--bg);
	}

	.mark {
		letter-spacing: 0.4em;
		text-transform: uppercase;
		font-weight: 600;
		color: color-mix(in srgb, var(--accent) 80%, white);
	}

	.hint {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.hero {
		max-width: 48rem;
		margin: auto 0;
		padding: clamp(1.15rem, 3.5vw, 2.75rem);
		border-radius: var(--card-radius);
		background: var(--card-bg);
		border: 1px solid var(--card-border);
		backdrop-filter: blur(18px) saturate(150%);
		-webkit-backdrop-filter: blur(18px) saturate(150%);
		box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8);
		transform: perspective(1200px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg));
		transition:
			background 0.5s ease,
			border-color 0.5s ease,
			border-radius 0.5s ease;
		will-change: transform;
	}

	h1 {
		margin: 0;
		font-family: var(--font-display);
		/* Bound by height as well as width so the card never outgrows short
		   viewports — the mono and wide-tracking palettes wrap sooner. */
		font-size: var(--h1-size, clamp(1.7rem, min(5.8vw, 6.7vh), 3.9rem));
		line-height: 1.04;
		font-weight: 800;
		letter-spacing: var(--tracking);
	}

	.line {
		display: block;
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	h1 em {
		font-style: normal;
		background: linear-gradient(
			100deg,
			var(--accent) 0%,
			var(--accent-2) 45%,
			var(--accent) 90%
		);
		background-size: 220% 100%;
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		animation: shimmer 9s linear infinite;
	}

	.lede {
		/* Vertical rhythm keys off viewport height so the card fits a phone. */
		margin: clamp(0.9rem, 2.4vh, 1.6rem) 0 0;
		max-width: 38rem;
		font-size: clamp(0.94rem, 2.1vw, 1.15rem);
		line-height: 1.6;
		color: var(--muted);
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: clamp(0.85rem, 2.2vh, 1.5rem) 0 0;
		padding: 0;
		list-style: none;
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	.tags li {
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: clamp(1.1rem, 2.8vh, 1.75rem);
		pointer-events: auto;
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	.links a {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.65rem 1.2rem;
		border-radius: 999px;
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
		color: var(--fg);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
		transition:
			transform 0.18s ease,
			background 0.18s ease,
			border-color 0.18s ease;
	}

	.links a span {
		transition: transform 0.18s ease;
	}

	.links a:hover {
		transform: translateY(-2px);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		border-color: color-mix(in srgb, var(--accent) 55%, transparent);
	}

	.links a:hover span {
		transform: translateX(3px);
	}

	.colophon {
		margin: clamp(0.9rem, 2.4vh, 1.5rem) 0 0;
		font-size: 0.72rem;
		letter-spacing: 0.06em;
		color: var(--faint);
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: calc(var(--i) * 70ms);
	}

	kbd {
		font: inherit;
		font-size: 0.68rem;
		padding: 0.15rem 0.35rem;
		border-radius: 0.3rem;
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes shimmer {
		to {
			background-position: 220% 0;
		}
	}

	@media (max-width: 640px) {
		.hint {
			display: none;
		}

		/* Blurring a canvas that repaints every frame is the most expensive
		   thing on the page — go lighter where the GPU budget is smallest. */
		.hero {
			backdrop-filter: blur(9px) saturate(135%);
			-webkit-backdrop-filter: blur(9px) saturate(135%);
		}
	}

	/* Short viewports — landscape phones and squat desktop windows alike.
	   Keyed on height only: width says nothing about the vertical budget. */
	@media (max-height: 620px) {
		main {
			padding-top: 0.5rem;
			padding-bottom: 5.25rem;
		}

		.hero {
			padding: 0.9rem 1.15rem;
		}

		h1 {
			font-size: var(--h1-size, clamp(1.4rem, min(5vw, 6.4vh), 2.4rem));
		}

		.tags,
		.colophon {
			display: none;
		}

		.lede {
			font-size: 0.88rem;
			line-height: 1.45;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero {
			transform: none;
		}

		.line,
		.lede,
		.tags,
		.links,
		.colophon {
			animation: none;
		}

		h1 em {
			animation: none;
		}

		.links a,
		.links a span {
			transition: none;
		}
	}
</style>
