<script>
	import { onMount } from 'svelte';
	import { createStage } from '$lib/stage.js';
	import { createNoise } from '$lib/noise.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	onMount(() =>
		createStage(canvas, (/** @type {CanvasRenderingContext2D} */ ctx, env) => {
			const noise = createNoise(1337);

			/** @typedef {{x:number,y:number,px:number,py:number,life:number,hue:number,speed:number}} Particle */
			/** @type {Particle[]} */
			let particles = [];

			/** @param {Particle} p */
			function reset(p) {
				p.x = Math.random() * env.width;
				p.y = Math.random() * env.height;
				p.px = p.x;
				p.py = p.y;
				p.life = 40 + Math.random() * 220;
				p.hue = 185 + Math.random() * 125; // teal -> violet
				p.speed = 0.6 + Math.random() * 1.5;
			}

			const SCALE = 0.0016;

			return {
				resize() {
					const count = Math.min(1600, Math.max(400, (env.width * env.height) / 1500));
					particles = Array.from({ length: count | 0 }, () => {
						const p = { x: 0, y: 0, px: 0, py: 0, life: 0, hue: 0, speed: 0 };
						reset(p);
						p.life = Math.random() * 260; // stagger the first respawn wave
						return p;
					});
					ctx.fillStyle = '#08080f';
					ctx.fillRect(0, 0, env.width, env.height);
				},

				frame() {
					const { width, height, pointer, dt } = env;

					// Fade the previous frame instead of clearing it — that's the trail.
					ctx.globalCompositeOperation = 'source-over';
					ctx.fillStyle = 'rgba(8, 8, 15, 0.075)';
					ctx.fillRect(0, 0, width, height);

					ctx.globalCompositeOperation = 'lighter';
					ctx.lineWidth = 1.1;

					const t = env.time * 0.1;
					const R = 220;

					for (const p of particles) {
						const angle = noise(p.x * SCALE, p.y * SCALE + t) * Math.PI * 3;
						let vx = Math.cos(angle) * p.speed;
						let vy = Math.sin(angle) * p.speed;

						// Particles curl around the cursor rather than fleeing it.
						const dx = p.x - pointer.x;
						const dy = p.y - pointer.y;
						const dist2 = dx * dx + dy * dy;
						if (dist2 < R * R) {
							const d = Math.sqrt(dist2) || 1;
							const f = (1 - d / R) * 3.4;
							vx += (-dy / d) * f + (dx / d) * f * 0.35;
							vy += (dx / d) * f + (dy / d) * f * 0.35;
						}

						p.px = p.x;
						p.py = p.y;
						p.x += vx * dt;
						p.y += vy * dt;
						p.life -= dt;

						if (p.life <= 0 || p.x < -10 || p.x > width + 10 || p.y < -10 || p.y > height + 10) {
							reset(p);
							continue;
						}

						const speed = Math.min(1, Math.hypot(vx, vy) / 3);
						ctx.strokeStyle = `hsla(${p.hue}, 92%, ${45 + speed * 42}%, 0.55)`;
						ctx.beginPath();
						ctx.moveTo(p.px, p.py);
						ctx.lineTo(p.x, p.y);
						ctx.stroke();
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
