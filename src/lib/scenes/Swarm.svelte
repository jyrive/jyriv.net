<script>
	import { onMount } from 'svelte';
	import { createStage } from '$lib/stage.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	onMount(() =>
		createStage(canvas, (/** @type {CanvasRenderingContext2D} */ ctx, env) => {
			/** @typedef {{x:number,y:number,vx:number,vy:number}} Boid */
			/** @type {Boid[]} */
			let boids = [];

			// Uniform grid so neighbour lookups stay linear instead of O(n²).
			const CELL = 70;
			let cols = 1;
			let rows = 1;
			/** @type {number[][]} */
			let grid = [];

			const MAX_SPEED = 2.6;
			const NEIGHBOUR = 62;
			const SEPARATION = 26;

			return {
				resize() {
					const count = Math.min(520, Math.max(160, (env.width * env.height) / 3600)) | 0;
					boids = Array.from({ length: count }, () => {
						const a = Math.random() * Math.PI * 2;
						return {
							x: Math.random() * env.width,
							y: Math.random() * env.height,
							vx: Math.cos(a) * MAX_SPEED,
							vy: Math.sin(a) * MAX_SPEED
						};
					});
					cols = Math.ceil(env.width / CELL) + 1;
					rows = Math.ceil(env.height / CELL) + 1;
					grid = Array.from({ length: cols * rows }, () => []);
				},

				frame() {
					const { width, height, pointer, dt } = env;

					ctx.globalCompositeOperation = 'source-over';
					ctx.fillStyle = 'rgba(6, 8, 14, 0.32)';
					ctx.fillRect(0, 0, width, height);

					for (const cell of grid) cell.length = 0;
					for (let i = 0; i < boids.length; i++) {
						const b = boids[i];
						const cx = Math.min(cols - 1, Math.max(0, (b.x / CELL) | 0));
						const cy = Math.min(rows - 1, Math.max(0, (b.y / CELL) | 0));
						grid[cy * cols + cx].push(i);
					}

					ctx.globalCompositeOperation = 'lighter';
					ctx.lineWidth = 1;

					for (let i = 0; i < boids.length; i++) {
						const b = boids[i];
						let ax = 0;
						let ay = 0;
						let alignX = 0;
						let alignY = 0;
						let cohX = 0;
						let cohY = 0;
						let n = 0;

						const cx = Math.min(cols - 1, Math.max(0, (b.x / CELL) | 0));
						const cy = Math.min(rows - 1, Math.max(0, (b.y / CELL) | 0));

						for (let gy = cy - 1; gy <= cy + 1; gy++) {
							if (gy < 0 || gy >= rows) continue;
							for (let gx = cx - 1; gx <= cx + 1; gx++) {
								if (gx < 0 || gx >= cols) continue;
								for (const j of grid[gy * cols + gx]) {
									if (j === i) continue;
									const o = boids[j];
									const dx = o.x - b.x;
									const dy = o.y - b.y;
									const d2 = dx * dx + dy * dy;
									if (d2 > NEIGHBOUR * NEIGHBOUR || d2 === 0) continue;

									n++;
									alignX += o.vx;
									alignY += o.vy;
									cohX += o.x;
									cohY += o.y;

									if (d2 < SEPARATION * SEPARATION) {
										const d = Math.sqrt(d2);
										ax -= (dx / d) * (1 - d / SEPARATION) * 1.5;
										ay -= (dy / d) * (1 - d / SEPARATION) * 1.5;
									}

									// Draw each link once, faded by distance.
									if (j > i && d2 < 46 * 46) {
										ctx.strokeStyle = `rgba(120, 220, 255, ${0.16 * (1 - Math.sqrt(d2) / 46)})`;
										ctx.beginPath();
										ctx.moveTo(b.x, b.y);
										ctx.lineTo(o.x, o.y);
										ctx.stroke();
									}
								}
							}
						}

						if (n > 0) {
							ax += (alignX / n - b.vx) * 0.06;
							ay += (alignY / n - b.vy) * 0.06;
							ax += (cohX / n - b.x) * 0.0012;
							ay += (cohY / n - b.y) * 0.0012;
						}

						// The cursor is a lure the flock orbits at a polite distance.
						const px = pointer.x - b.x;
						const py = pointer.y - b.y;
						const pd = Math.hypot(px, py) || 1;
						if (pd < 420) {
							const pull = pd > 110 ? 0.05 : -0.14;
							ax += (px / pd) * pull;
							ay += (py / pd) * pull;
							ax += (-py / pd) * 0.05;
							ay += (px / pd) * 0.05;
						}

						b.vx += ax * dt;
						b.vy += ay * dt;

						const sp = Math.hypot(b.vx, b.vy) || 1;
						if (sp > MAX_SPEED) {
							b.vx = (b.vx / sp) * MAX_SPEED;
							b.vy = (b.vy / sp) * MAX_SPEED;
						} else if (sp < 1.2) {
							b.vx = (b.vx / sp) * 1.2;
							b.vy = (b.vy / sp) * 1.2;
						}

						b.x += b.vx * dt;
						b.y += b.vy * dt;

						// Wrap, so the flock never piles up against an edge.
						if (b.x < -20) b.x += width + 40;
						else if (b.x > width + 20) b.x -= width + 40;
						if (b.y < -20) b.y += height + 40;
						else if (b.y > height + 20) b.y -= height + 40;

						// Body: a dart pointing along its heading.
						const ux = b.vx / sp;
						const uy = b.vy / sp;
						ctx.fillStyle = `hsla(${186 + sp * 22}, 100%, ${62 + sp * 8}%, 0.9)`;
						ctx.beginPath();
						ctx.moveTo(b.x + ux * 7, b.y + uy * 7);
						ctx.lineTo(b.x - ux * 4 - uy * 3, b.y - uy * 4 + ux * 3);
						ctx.lineTo(b.x - ux * 4 + uy * 3, b.y - uy * 4 - ux * 3);
						ctx.closePath();
						ctx.fill();
					}
				}
			};
		})
	);
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		display: block;
	}
</style>
