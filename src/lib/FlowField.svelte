<script>
	import { onMount } from 'svelte';

	/** @type {HTMLCanvasElement} */
	let canvas;

	onMount(() => {
		const maybeCtx = canvas.getContext('2d', { alpha: true });
		if (!maybeCtx) return;
		const ctx = maybeCtx;

		let width = 0;
		let height = 0;
		let dpr = Math.min(window.devicePixelRatio || 1, 2);
		let raf = 0;
		let running = true;

		// --- Cheap, dependency-free value-noise field -------------------------
		const perm = new Uint8Array(512);
		(() => {
			const p = new Uint8Array(256);
			for (let i = 0; i < 256; i++) p[i] = i;
			for (let i = 255; i > 0; i--) {
				const j = (Math.random() * (i + 1)) | 0;
				[p[i], p[j]] = [p[j], p[i]];
			}
			for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
		})();

		const fade = (/** @type {number} */ t) => t * t * t * (t * (t * 6 - 15) + 10);
		const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) =>
			a + (b - a) * t;
		const grad = (/** @type {number} */ h, /** @type {number} */ x, /** @type {number} */ y) => {
			const u = h & 1 ? x : -x;
			const v = h & 2 ? y : -y;
			return u + v;
		};

		/** 2D value/gradient noise in roughly [-1, 1] */
		function noise(/** @type {number} */ x, /** @type {number} */ y) {
			const X = Math.floor(x) & 255;
			const Y = Math.floor(y) & 255;
			x -= Math.floor(x);
			y -= Math.floor(y);
			const u = fade(x);
			const v = fade(y);
			const aa = perm[perm[X] + Y];
			const ab = perm[perm[X] + Y + 1];
			const ba = perm[perm[X + 1] + Y];
			const bb = perm[perm[X + 1] + Y + 1];
			return lerp(
				lerp(grad(aa, x, y), grad(ba, x - 1, y), u),
				lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u),
				v
			);
		}

		// --- Particles --------------------------------------------------------
		/** @typedef {{x:number,y:number,px:number,py:number,life:number,hue:number,speed:number}} Particle */
		/** @type {Particle[]} */
		let particles = [];
		let particleCount = 0;

		const pointer = { x: 0, y: 0, active: false, tx: 0, ty: 0 };

		/** @param {Particle} p */
		function reset(p) {
			p.x = Math.random() * width;
			p.y = Math.random() * height;
			p.px = p.x;
			p.py = p.y;
			p.life = 40 + Math.random() * 220;
			p.hue = 200 + Math.random() * 120; // teal -> violet
			p.speed = 0.6 + Math.random() * 1.4;
		}

		function build() {
			const area = width * height;
			particleCount = Math.floor(Math.min(1400, Math.max(350, area / 1600)));
			particles = new Array(particleCount);
			for (let i = 0; i < particleCount; i++) {
				const p = { x: 0, y: 0, px: 0, py: 0, life: 0, hue: 0, speed: 0 };
				reset(p);
				particles[i] = p;
			}
		}

		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.floor(width * dpr);
			canvas.height = Math.floor(height * dpr);
			canvas.style.width = width + 'px';
			canvas.style.height = height + 'px';
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.fillStyle = '#0a0a12';
			ctx.fillRect(0, 0, width, height);
			pointer.x = pointer.tx = width / 2;
			pointer.y = pointer.ty = height / 2;
			build();
		}

		const SCALE = 0.0016; // field zoom
		let t = 0;

		function frame() {
			if (!running) return;
			t += 0.0016;

			// Trails: fade the previous frame instead of clearing.
			ctx.globalCompositeOperation = 'source-over';
			ctx.fillStyle = 'rgba(10, 10, 18, 0.075)';
			ctx.fillRect(0, 0, width, height);

			// Ease pointer for smooth interaction.
			pointer.x += (pointer.tx - pointer.x) * 0.08;
			pointer.y += (pointer.ty - pointer.y) * 0.08;

			ctx.globalCompositeOperation = 'lighter';
			ctx.lineWidth = 1.1;

			for (let i = 0; i < particleCount; i++) {
				const p = particles[i];
				const angle = noise(p.x * SCALE, p.y * SCALE + t) * Math.PI * 3;
				let vx = Math.cos(angle) * p.speed;
				let vy = Math.sin(angle) * p.speed;

				// Pointer swirl — particles curl around the cursor.
				const dx = p.x - pointer.x;
				const dy = p.y - pointer.y;
				const dist2 = dx * dx + dy * dy;
				const R = 200;
				if (dist2 < R * R) {
					const d = Math.sqrt(dist2) || 1;
					const f = (1 - d / R) * 3.2;
					vx += (-dy / d) * f + (dx / d) * f * 0.35;
					vy += (dx / d) * f + (dy / d) * f * 0.35;
				}

				p.px = p.x;
				p.py = p.y;
				p.x += vx;
				p.y += vy;
				p.life -= 1;

				if (
					p.life <= 0 ||
					p.x < -10 ||
					p.x > width + 10 ||
					p.y < -10 ||
					p.y > height + 10
				) {
					reset(p);
					continue;
				}

				const speed = Math.min(1, Math.hypot(vx, vy) / 3);
				const light = 45 + speed * 40;
				ctx.strokeStyle = `hsla(${p.hue}, 90%, ${light}%, 0.55)`;
				ctx.beginPath();
				ctx.moveTo(p.px, p.py);
				ctx.lineTo(p.x, p.y);
				ctx.stroke();
			}

			raf = requestAnimationFrame(frame);
		}

		/** @param {number} clientX @param {number} clientY */
		function onMove(clientX, clientY) {
			pointer.tx = clientX;
			pointer.ty = clientY;
			pointer.active = true;
		}

		const handleMouse = (/** @type {MouseEvent} */ e) => onMove(e.clientX, e.clientY);
		const handleTouch = (/** @type {TouchEvent} */ e) => {
			if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
		};
		const handleVisibility = () => {
			running = document.visibilityState === 'visible';
			if (running) {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(frame);
			}
		};

		resize();
		raf = requestAnimationFrame(frame);

		window.addEventListener('resize', resize);
		window.addEventListener('mousemove', handleMouse);
		window.addEventListener('touchmove', handleTouch, { passive: true });
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			running = false;
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', handleMouse);
			window.removeEventListener('touchmove', handleTouch);
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		display: block;
		z-index: 0;
	}
</style>
