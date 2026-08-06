<script>
	import { onMount } from 'svelte';
	import { createStage } from '$lib/stage.js';
	import { createNoise } from '$lib/noise.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	onMount(() =>
		createStage(canvas, (/** @type {CanvasRenderingContext2D} */ ctx, env) => {
			const noise = createNoise(90210);

			const Z_STEP = 0.55;
			const ROWS = 72; // far enough that the mesh reaches the horizon line
			const X_MIN = -16;
			const X_MAX = 16;
			const CAM_Y = 1.05;

			/** @type {{x:number,y:number,r:number,tw:number}[]} */
			let stars = [];

			/** Terrain rises only outside a flat central corridor. */
			const heightAt = (/** @type {number} */ x, /** @type {number} */ z) => {
				const ridge = Math.min(1, Math.max(0, (Math.abs(x) - 2.6) / 5.5));
				return noise(x * 0.19, z * 0.17) * 1.35 * ridge * ridge;
			};

			return {
				resize() {
					const count = Math.min(220, (env.width / 8) | 0);
					stars = Array.from({ length: count }, () => ({
						x: Math.random() * env.width,
						y: Math.random() * env.height * 0.55,
						r: Math.random() * 1.3 + 0.2,
						tw: Math.random() * Math.PI * 2
					}));
				},

				frame() {
					const { width, height, pointer, dt } = env;
					const horizon = height * 0.58;
					const focal = height * 0.95;
					const centerX = width / 2;
					const camX = (pointer.nx - 0.5) * 7;
					const scroll = (env.time * 1.15) % Z_STEP;

					// Sky.
					const sky = ctx.createLinearGradient(0, 0, 0, horizon);
					sky.addColorStop(0, '#0b0320');
					sky.addColorStop(0.55, '#2a0a49');
					sky.addColorStop(1, '#71166b');
					ctx.globalCompositeOperation = 'source-over';
					ctx.fillStyle = sky;
					ctx.fillRect(0, 0, width, horizon);

					// Ground picks up the sky's colour at the seam so the horizon
					// reads as haze rather than a hard edge.
					const ground = ctx.createLinearGradient(0, horizon, 0, height);
					ground.addColorStop(0, '#5c1258');
					ground.addColorStop(0.12, '#20063a');
					ground.addColorStop(1, '#07030f');
					ctx.fillStyle = ground;
					ctx.fillRect(0, horizon, width, height - horizon);

					// Stars.
					for (const s of stars) {
						s.tw += 0.05 * dt;
						ctx.globalAlpha = 0.25 + Math.abs(Math.sin(s.tw)) * 0.6;
						ctx.fillStyle = '#ffe9ff';
						ctx.fillRect(s.x, s.y, s.r, s.r);
					}
					ctx.globalAlpha = 1;

					// Sun: a banded disc sinking into the horizon.
					const sunX = centerX - camX * 12;
					const sunY = horizon - height * 0.1;
					const sunR = Math.min(width, height) * 0.16;
					const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
					sunGrad.addColorStop(0, '#ffe36b');
					sunGrad.addColorStop(0.5, '#ff7a3d');
					sunGrad.addColorStop(1, '#ff2a86');

					ctx.save();
					ctx.beginPath();
					ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
					ctx.clip();
					ctx.fillStyle = sunGrad;
					ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
					// Slits widen toward the bottom of the disc.
					ctx.fillStyle = '#1a0426';
					for (let i = 0; i < 9; i++) {
						const p = i / 9;
						const y = sunY + sunR * (p * 1.05 - 0.05);
						ctx.fillRect(sunX - sunR, y, sunR * 2, 1.5 + p * 7);
					}
					ctx.restore();

					ctx.globalCompositeOperation = 'lighter';
					const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 2.6);
					glow.addColorStop(0, 'rgba(255, 90, 150, 0.35)');
					glow.addColorStop(1, 'rgba(255, 60, 140, 0)');
					ctx.fillStyle = glow;
					ctx.fillRect(0, 0, width, horizon + 40);

					// Grid: every segment collected into one path, stroked twice —
					// once wide and faint for the neon bloom, once thin and bright.
					ctx.beginPath();
					/** @param {number} x @param {number} z */
					const project = (x, z) => {
						const inv = focal / z;
						return [centerX + (x - camX) * inv, horizon + (CAM_Y - heightAt(x, z)) * inv];
					};

					for (let i = 0; i < ROWS; i++) {
						const z = 0.75 + i * Z_STEP - scroll;
						if (z <= 0.4) continue;
						for (let x = X_MIN; x <= X_MAX; x++) {
							const [sx, sy] = project(x, z);
							if (x === X_MIN) ctx.moveTo(sx, sy);
							else ctx.lineTo(sx, sy);
						}
					}
					for (let x = X_MIN; x <= X_MAX; x++) {
						let started = false;
						for (let i = 0; i < ROWS; i++) {
							const z = 0.75 + i * Z_STEP - scroll;
							if (z <= 0.4) continue;
							const [sx, sy] = project(x, z);
							if (!started) {
								ctx.moveTo(sx, sy);
								started = true;
							} else ctx.lineTo(sx, sy);
						}
					}

					ctx.lineJoin = 'round';
					ctx.strokeStyle = 'rgba(255, 46, 148, 0.20)';
					ctx.lineWidth = 5;
					ctx.stroke();
					ctx.strokeStyle = 'rgba(120, 255, 246, 0.55)';
					ctx.lineWidth = 1.1;
					ctx.stroke();

					// Haze at the horizon line hides where the grid runs out.
					const haze = ctx.createLinearGradient(0, horizon - height * 0.14, 0, horizon + 8);
					haze.addColorStop(0, 'rgba(120, 255, 246, 0)');
					haze.addColorStop(1, 'rgba(90, 210, 255, 0.22)');
					ctx.fillStyle = haze;
					ctx.fillRect(0, horizon - height * 0.14, width, height * 0.14 + 8);
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
