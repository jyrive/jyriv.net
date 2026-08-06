<script>
	import { onMount } from 'svelte';
	import { createStage } from '$lib/stage.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01<>[]{}/\\|=+*#$%&@ABCDEFJKLMNPQRSTUVWXYZ';
	const pick = () => CHARS[(Math.random() * CHARS.length) | 0];

	onMount(() =>
		createStage(canvas, (/** @type {CanvasRenderingContext2D} */ ctx, env) => {
			const CELL_W = 13;
			const CELL_H = 19;

			/** @typedef {{y:number,speed:number,row:number,glyph:string}} Column */
			/** @type {Column[]} */
			let columns = [];

			return {
				resize() {
					const count = Math.ceil(env.width / CELL_W);
					columns = Array.from({ length: count }, () => ({
						y: -Math.random() * 60,
						speed: 0.18 + Math.random() * 0.42,
						row: -1,
						glyph: pick()
					}));
					ctx.fillStyle = '#04090a';
					ctx.fillRect(0, 0, env.width, env.height);
				},

				frame() {
					const { width, height, pointer, dt } = env;
					const rows = Math.ceil(height / CELL_H);

					// Trails are just the previous frame decaying toward black.
					ctx.globalCompositeOperation = 'source-over';
					ctx.fillStyle = 'rgba(4, 9, 10, 0.085)';
					ctx.fillRect(0, 0, width, height);

					ctx.globalCompositeOperation = 'lighter';
					ctx.font = '15px ui-monospace, SFMono-Regular, Menlo, monospace';
					ctx.textBaseline = 'top';

					for (let c = 0; c < columns.length; c++) {
						const col = columns[c];
						const x = c * CELL_W;

						// Columns under the cursor race ahead and burn amber.
						const dx = Math.abs(x - pointer.x);
						const heat = dx < 190 ? 1 - dx / 190 : 0;

						col.y += col.speed * (1 + heat * 2.6) * dt;
						const row = Math.floor(col.y);

						if (row !== col.row) {
							col.row = row;
							col.glyph = pick();

							if (row >= 0 && row <= rows) {
								const y = row * CELL_H;
								const near = heat > 0 && Math.abs(y - pointer.y) < 150;
								ctx.fillStyle = near
									? `rgba(255, 196, 92, ${0.75 + heat * 0.25})`
									: `rgba(120, 255, 190, ${0.55 + Math.random() * 0.3})`;
								ctx.fillText(col.glyph, x, y);

								// A brighter core on the leading glyph reads as the "head".
								if (Math.random() < 0.55) {
									ctx.fillStyle = near
										? 'rgba(255, 240, 210, 0.55)'
										: 'rgba(225, 255, 245, 0.4)';
									ctx.fillText(col.glyph, x, y);
								}
							}
						}

						// Occasional stray glyph flickering back to life in the trail.
						if (Math.random() < 0.012 + heat * 0.05) {
							const y = Math.max(0, row - ((Math.random() * 22) | 0)) * CELL_H;
							ctx.fillStyle = heat > 0.3 ? 'rgba(255, 190, 90, 0.35)' : 'rgba(90, 220, 165, 0.3)';
							ctx.fillText(pick(), x, y);
						}

						if (row > rows + 4 + Math.random() * 30) {
							col.y = -Math.random() * 40;
							col.row = -1;
							col.speed = 0.18 + Math.random() * 0.42;
						}
					}
				}
			};
		})
	);
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>
<div class="crt" aria-hidden="true"></div>

<style>
	canvas {
		position: fixed;
		inset: 0;
		display: block;
	}

	/* Scanlines + vignette, kept in CSS so the canvas loop stays cheap. */
	.crt {
		position: fixed;
		inset: 0;
		pointer-events: none;
		background:
			repeating-linear-gradient(
				to bottom,
				rgba(0, 0, 0, 0.28) 0px,
				rgba(0, 0, 0, 0.28) 1px,
				transparent 1px,
				transparent 3px
			),
			radial-gradient(120% 90% at 50% 45%, transparent 45%, rgba(0, 0, 0, 0.75) 100%);
		mix-blend-mode: multiply;
	}
</style>
