<script>
	/**
	 * @type {{
	 *   scenes: import('./scenes/index.js').Scene[],
	 *   current: string,
	 *   onselect: (id: string) => void
	 * }}
	 */
	let { scenes, current, onselect } = $props();

	const active = $derived(scenes.find((s) => s.id === current) ?? scenes[0]);

	/** @type {Record<string, HTMLButtonElement>} */
	const buttons = {};

	// On a phone the dock scrolls horizontally, so the selected scene can sit
	// off-screen — keep it in view however the switch was made.
	$effect(() => {
		const el = buttons[current];
		if (!el) return;
		const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({
			inline: 'center',
			block: 'nearest',
			behavior: smooth ? 'smooth' : 'auto'
		});
	});
</script>

<div class="dock-wrap">
	<p class="tagline" aria-live="polite">{active.tagline}</p>

	<div class="dock" role="group" aria-label="Background scene">
		{#each scenes as scene, i (scene.id)}
			<button
				type="button"
				class="scene"
				bind:this={buttons[scene.id]}
				class:active={scene.id === current}
				aria-pressed={scene.id === current}
				title="{scene.name} — press {i + 1}"
				onclick={() => onselect(scene.id)}
			>
				<span
					class="dot"
					style="--a: {scene.swatch[0]}; --b: {scene.swatch[1]}"
					aria-hidden="true"
				></span>
				<span class="name">{scene.name}</span>
				<kbd aria-hidden="true">{i + 1}</kbd>
			</button>
		{/each}
	</div>
</div>

<style>
	.dock-wrap {
		position: fixed;
		left: 50%;
		bottom: clamp(0.75rem, 3vw, 1.75rem);
		transform: translateX(-50%);
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		max-width: min(100vw - 1rem, 60rem);
	}

	.tagline {
		margin: 0;
		font-size: 0.78rem;
		letter-spacing: 0.02em;
		color: var(--faint);
		text-align: center;
		padding: 0 0.75rem;
	}

	.dock {
		display: flex;
		gap: 0.3rem;
		padding: 0.35rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--bg) 62%, transparent);
		border: 1px solid var(--card-border);
		backdrop-filter: blur(16px) saturate(160%);
		-webkit-backdrop-filter: blur(16px) saturate(160%);
		box-shadow: 0 18px 45px -18px rgba(0, 0, 0, 0.85);
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.dock::-webkit-scrollbar {
		display: none;
	}

	.scene {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.85rem;
		border: 1px solid transparent;
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease,
			transform 0.2s ease;
	}

	.scene:hover {
		color: var(--fg);
		background: var(--chip-bg);
		transform: translateY(-1px);
	}

	.scene.active {
		color: var(--fg);
		background: color-mix(in srgb, var(--accent) 16%, transparent);
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--a), var(--b));
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
	}

	.scene.active .dot {
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.25) inset,
			0 0 12px 1px var(--a);
	}

	kbd {
		font: inherit;
		font-size: 0.68rem;
		line-height: 1;
		padding: 0.2rem 0.32rem;
		border-radius: 0.3rem;
		color: var(--faint);
		background: var(--chip-bg);
		border: 1px solid var(--chip-border);
	}

	@media (max-width: 640px) {
		.scene .name {
			font-size: 0.8rem;
		}

		kbd {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.scene {
			transition: none;
		}

		.scene:hover {
			transform: none;
		}
	}
</style>
