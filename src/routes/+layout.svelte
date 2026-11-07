<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import SceneSwitcher from '$lib/SceneSwitcher.svelte';
	import { scene } from '$lib/scene.svelte.js';
	import { scenes } from '$lib/scenes/index.js';

	let { children } = $props();

	/** Long-form pages put a scrim over the backdrop so body text has a ground.
	    Keyed on the route id rather than the URL so it survives a base path. */
	const reading = $derived(page.route.id?.startsWith('/blog') ?? false);

	/** While reading, the dock gets out of the way on the way down. */
	let dockHidden = $state(false);
	let lastY = 0;

	function onScroll() {
		const y = window.scrollY;
		const dy = y - lastY;
		if (Math.abs(dy) > 6) {
			dockHidden = reading && dy > 0 && y > 320;
			lastY = y;
		}
	}

	// The palette can be applied immediately; rewriting the URL has to wait for
	// the router, which isn't up yet when the first effect runs.
	let routerReady = $state(false);
	afterNavigate(() => (routerReady = true));

	onMount(() => scene.adopt());

	$effect(() => {
		if (!scene.mounted) return;
		scene.persist();
		if (routerReady) scene.syncUrl();
	});

	// A new page starts at the top with the dock back in view.
	$effect(() => {
		page.route.id;
		dockHidden = false;
		lastY = 0;
	});

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
			scene.current = scenes[n - 1].id;
			e.preventDefault();
		} else if (e.key === 'ArrowRight') {
			scene.step(1);
			e.preventDefault();
		} else if (e.key === 'ArrowLeft') {
			scene.step(-1);
			e.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} onscroll={onScroll} />

{#if scene.mounted}
	{#key scene.active.id}
		{@const Backdrop = scene.active.component}
		<Backdrop />
	{/key}
{/if}

<div class="scrim" class:reading aria-hidden="true"></div>

{@render children()}

<SceneSwitcher
	{scenes}
	current={scene.current}
	compact={reading}
	hidden={dockHidden}
	onselect={(id) => (scene.current = id)}
/>

<style>
	/* Sits between the canvas (z-index auto) and the page content (z-index 1),
	   fading the backdrop down to a texture while you read. */
	.scrim {
		position: fixed;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		background:
			radial-gradient(135% 105% at 50% 0%, transparent 30%, var(--bg) 100%),
			color-mix(in srgb, var(--bg) 55%, transparent);
		transition: opacity 0.55s ease;
	}

	.scrim.reading {
		opacity: 1;
	}

	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
	}

	/* ---- Palettes -------------------------------------------------------
	   Each backdrop owns a matching UI palette. They live in CSS (rather than
	   in the scene registry) so the inline script in app.html can set
	   data-scene before first paint and avoid a flash of the wrong theme. */

	:global(html) {
		--bg: #08080f;
		--fg: #e9edff;
		--muted: rgba(226, 232, 255, 0.72);
		--faint: rgba(200, 210, 240, 0.45);
		--accent: #6bb8ff;
		--accent-2: #c77dff;
		--card-bg: rgba(14, 14, 28, 0.42);
		--card-border: rgba(255, 255, 255, 0.1);
		--card-radius: 1.5rem;
		--chip-bg: rgba(255, 255, 255, 0.06);
		--chip-border: rgba(255, 255, 255, 0.12);
		/* The values a light palette would have to invert. Every palette is dark
		   at the moment, but keeping them as tokens means a scene can flip the
		   whole UI without hunting down hardcoded blacks. */
		--mark: color-mix(in srgb, var(--accent) 80%, white);
		--shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.8);
		--shadow-dock: 0 18px 45px -18px rgba(0, 0, 0, 0.85);
		--code-bg: color-mix(in srgb, #000 45%, transparent);
		--font-display:
			system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		--font-body: var(--font-display);
		/* Prose keeps one readable face whatever display font a scene picks. */
		--font-prose: ui-serif, 'Iowan Old Style', Georgia, 'Times New Roman', serif;
		--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		--tracking: -0.03em;
	}

	:global(html[data-scene='plasma']) {
		--bg: #0d0318;
		--fg: #ffeaf7;
		--muted: rgba(255, 226, 245, 0.76);
		--faint: rgba(255, 214, 240, 0.5);
		--accent: #ff5ec7;
		--accent-2: #ffb26b;
		--card-bg: rgba(26, 5, 34, 0.42);
		--card-border: rgba(255, 160, 220, 0.18);
		--chip-bg: rgba(255, 120, 200, 0.1);
		--chip-border: rgba(255, 150, 210, 0.24);
	}

	:global(html[data-scene='swarm']) {
		--bg: #06080e;
		--fg: #eaf6ff;
		--muted: rgba(220, 240, 255, 0.72);
		--faint: rgba(190, 220, 240, 0.45);
		--accent: #7ae7ff;
		--accent-2: #ffffff;
		--card-bg: rgba(8, 14, 24, 0.5);
		--card-border: rgba(140, 220, 255, 0.16);
		--card-radius: 0.5rem;
		--chip-bg: rgba(120, 220, 255, 0.08);
		--chip-border: rgba(140, 220, 255, 0.2);
	}

	:global(html[data-scene='synth']) {
		--bg: #07030f;
		--fg: #ffe9ff;
		--muted: rgba(255, 220, 255, 0.76);
		--faint: rgba(230, 190, 255, 0.5);
		--accent: #78fff6;
		--accent-2: #ff2e94;
		--card-bg: rgba(20, 4, 38, 0.45);
		--card-border: rgba(255, 46, 148, 0.28);
		--card-radius: 0.25rem;
		--chip-bg: rgba(255, 46, 148, 0.1);
		--chip-border: rgba(120, 255, 246, 0.28);
		--tracking: -0.02em;
	}

	/* Studio dark, for the one scene that lights a single object. */
	:global(html[data-scene='car']) {
		--bg: #0a0c11;
		--fg: #eaf0f8;
		--muted: rgba(228, 238, 250, 0.74);
		--faint: rgba(200, 214, 232, 0.5);
		--accent: #5fd3a3;
		--accent-2: #cfe4ff;
		--card-bg: rgba(11, 15, 23, 0.52);
		--card-border: rgba(160, 190, 220, 0.14);
		--card-radius: 0.75rem;
		--chip-bg: rgba(160, 200, 230, 0.07);
		--chip-border: rgba(160, 200, 230, 0.16);
		--tracking: -0.025em;
	}

	:global(body) {
		min-height: 100dvh;
		background: var(--bg);
		color: var(--fg);
		font-family: var(--font-body);
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		overflow-x: hidden;
		transition:
			background 0.5s ease,
			color 0.5s ease;
	}

	:global(::selection) {
		background: color-mix(in srgb, var(--accent) 40%, transparent);
	}

	:global(:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
		border-radius: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		.scrim {
			transition: none;
		}
	}
</style>
