<script>
	let { children } = $props();
</script>

{@render children()}

<style>
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
		--font-display:
			system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		--font-body: var(--font-display);
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

	:global(html[data-scene='glyphs']) {
		--bg: #04090a;
		--fg: #d9ffe9;
		--muted: rgba(160, 255, 205, 0.72);
		--faint: rgba(120, 220, 175, 0.5);
		--accent: #6bffc0;
		--accent-2: #ffc45c;
		--card-bg: rgba(3, 18, 14, 0.62);
		--card-border: rgba(107, 255, 192, 0.22);
		--card-radius: 0.35rem;
		--chip-bg: rgba(107, 255, 192, 0.08);
		--chip-border: rgba(107, 255, 192, 0.25);
		--font-display: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		--font-body: var(--font-display);
		--tracking: -0.01em;
		/* Monospace runs much wider — pull the headline back a size. */
		--h1-size: clamp(1.35rem, min(4.9vw, 7vh), 3.3rem);
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
</style>
