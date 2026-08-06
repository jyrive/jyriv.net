/**
 * Shared canvas plumbing used by every scene: DPR-aware sizing, an eased
 * pointer, a rAF loop that idles while the tab is hidden, and a short "settle
 * then freeze" run for visitors who asked for reduced motion.
 */

/**
 * @typedef {object} Pointer
 * @property {number} x   eased position in CSS pixels
 * @property {number} y
 * @property {number} tx  raw target position
 * @property {number} ty
 * @property {number} nx  eased position normalised to 0..1
 * @property {number} ny
 * @property {boolean} moved  true once the visitor has actually pointed at something
 */

/**
 * @typedef {object} StageEnv
 * @property {number} width   viewport width in CSS pixels
 * @property {number} height
 * @property {number} dpr
 * @property {number} time    seconds since the scene started
 * @property {number} dt      frame delta normalised so 60fps === 1
 * @property {boolean} reduced
 * @property {Pointer} pointer
 */

/**
 * @typedef {object} Scene
 * @property {() => void} frame
 * @property {() => void} [resize]
 * @property {() => void} [dispose]
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(ctx: any, env: StageEnv) => Scene | undefined} setup
 * @param {{ context?: '2d' | 'webgl', attributes?: object, reducedFrames?: number, ease?: number, maxDpr?: number }} [options]
 * @returns {() => void} cleanup
 */
export function createStage(canvas, setup, options = {}) {
	const { context = '2d', reducedFrames = 90, ease = 0.08, maxDpr = 2 } = options;
	const attributes = options.attributes ?? { alpha: false };
	const maybeCtx = canvas.getContext(context, attributes);
	if (!maybeCtx) return () => {};
	// Each scene narrows this back to the context type it asked for.
	const ctx = /** @type {any} */ (maybeCtx);

	const reduced =
		typeof window.matchMedia === 'function' &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/** @type {StageEnv} */
	const env = {
		width: 1,
		height: 1,
		dpr: 1,
		time: 0,
		dt: 1,
		reduced,
		pointer: { x: 0, y: 0, tx: 0, ty: 0, nx: 0.5, ny: 0.5, moved: false }
	};

	const maybeScene = setup(ctx, env);
	if (!maybeScene) return () => {};
	const scene = maybeScene;

	let raf = 0;
	let running = true;
	let last = 0;
	let budget = reduced ? reducedFrames : Infinity;

	function resize() {
		env.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
		env.width = Math.max(1, window.innerWidth);
		env.height = Math.max(1, window.innerHeight);
		canvas.width = Math.floor(env.width * env.dpr);
		canvas.height = Math.floor(env.height * env.dpr);
		canvas.style.width = env.width + 'px';
		canvas.style.height = env.height + 'px';
		if (context === '2d') ctx.setTransform(env.dpr, 0, 0, env.dpr, 0, 0);
		else ctx.viewport(0, 0, canvas.width, canvas.height);

		if (!env.pointer.moved) {
			env.pointer.x = env.pointer.tx = env.width / 2;
			env.pointer.y = env.pointer.ty = env.height * 0.45;
		}
		scene.resize?.();
		// A resized still frame would otherwise stay blank for reduced motion.
		if (reduced) {
			budget = reducedFrames;
			schedule();
		}
	}

	/** @param {number} now */
	function tick(now) {
		if (!running) return;
		const delta = last ? now - last : 16.67;
		last = now;
		env.dt = Math.min(3, delta / 16.667);
		env.time += delta / 1000;

		const p = env.pointer;
		const k = reduced ? 1 : ease;
		p.x += (p.tx - p.x) * k;
		p.y += (p.ty - p.y) * k;
		p.nx = p.x / env.width;
		p.ny = p.y / env.height;

		scene.frame();

		if (--budget > 0) raf = requestAnimationFrame(tick);
		else raf = 0;
	}

	function schedule() {
		if (raf) cancelAnimationFrame(raf);
		last = 0;
		raf = requestAnimationFrame(tick);
	}

	/** @param {number} clientX @param {number} clientY */
	function point(clientX, clientY) {
		env.pointer.tx = clientX;
		env.pointer.ty = clientY;
		env.pointer.moved = true;
		// Reduced-motion stages are frozen; nudge one more still frame out.
		if (reduced && !raf) {
			budget = 2;
			schedule();
		}
	}

	const onMouse = (/** @type {MouseEvent} */ e) => point(e.clientX, e.clientY);
	const onTouch = (/** @type {TouchEvent} */ e) => {
		const t = e.touches[0];
		if (t) point(t.clientX, t.clientY);
	};
	const onVisibility = () => {
		running = document.visibilityState === 'visible';
		if (running && budget > 0) schedule();
	};

	resize();
	schedule();

	window.addEventListener('resize', resize);
	window.addEventListener('mousemove', onMouse, { passive: true });
	window.addEventListener('touchmove', onTouch, { passive: true });
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		running = false;
		if (raf) cancelAnimationFrame(raf);
		window.removeEventListener('resize', resize);
		window.removeEventListener('mousemove', onMouse);
		window.removeEventListener('touchmove', onTouch);
		document.removeEventListener('visibilitychange', onVisibility);
		scene.dispose?.();
	};
}

/**
 * Compile a fullscreen-quad shader program.
 *
 * @param {WebGLRenderingContext} gl
 * @param {string} fragment
 * @returns {WebGLProgram | null}
 */
export function createProgram(gl, fragment) {
	const vertex = `
		attribute vec2 a_pos;
		void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
	`;

	/** @param {number} type @param {string} src */
	const compile = (type, src) => {
		const shader = gl.createShader(type);
		if (!shader) return null;
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.warn('shader:', gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	};

	const vs = compile(gl.VERTEX_SHADER, vertex);
	const fs = compile(gl.FRAGMENT_SHADER, fragment);
	if (!vs || !fs) return null;

	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	gl.deleteShader(vs);
	gl.deleteShader(fs);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.warn('program:', gl.getProgramInfoLog(program));
		return null;
	}

	// One oversized triangle covers the viewport with no index buffer.
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(program, 'a_pos');
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	gl.useProgram(program);

	return program;
}
