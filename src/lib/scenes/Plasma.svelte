<script>
	import { onMount } from 'svelte';
	import { createStage, createProgram } from '$lib/stage.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	const FRAGMENT = `
		#ifdef GL_FRAGMENT_PRECISION_HIGH
		precision highp float;
		#else
		precision mediump float;
		#endif

		uniform vec2 u_res;
		uniform vec2 u_mouse;
		uniform float u_time;

		float hash(vec2 p) {
			return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
		}

		float vnoise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			vec2 u = f * f * (3.0 - 2.0 * f);
			return mix(
				mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
				mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
				u.y
			);
		}

		float fbm(vec2 p) {
			float v = 0.0;
			float a = 0.5;
			mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
			for (int i = 0; i < 5; i++) {
				v += a * vnoise(p);
				p = rot * p * 2.02;
				a *= 0.5;
			}
			return v;
		}

		void main() {
			float s = min(u_res.x, u_res.y);
			vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / s;
			vec2 m = (u_mouse - 0.5 * u_res) / s;
			float t = u_time * 0.075;

			vec2 p = uv * 1.7;

			// The cursor drags the field toward itself like a thumb through paint.
			vec2 toM = uv - m;
			float md = length(toM);
			p += normalize(toM + 1e-5) * 0.30 * exp(-md * 2.6);

			// Two rounds of domain warping give the fluid, marbled folds.
			vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
			vec2 r = vec2(
				fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.35 * t),
				fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.28 * t)
			);
			float f = fbm(p + 3.0 * r);

			vec3 deep = vec3(0.05, 0.02, 0.12);
			vec3 mid  = vec3(0.58, 0.08, 0.56);
			vec3 hot  = vec3(1.00, 0.46, 0.30);

			vec3 col = mix(deep, mid, smoothstep(0.24, 0.62, f));
			col = mix(col, hot, smoothstep(0.58, 0.88, f));
			col += vec3(0.20, 0.55, 1.00) * smoothstep(0.72, 1.00, r.y) * 0.55;
			col += vec3(1.00, 0.40, 0.75) * 0.20 * exp(-md * 4.5);

			col *= 1.0 - 0.42 * dot(uv, uv);
			col += (hash(gl_FragCoord.xy) - 0.5) * 0.02; // dither away the banding
			gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
		}
	`;

	onMount(() =>
		createStage(
			canvas,
			(/** @type {WebGLRenderingContext} */ gl, env) => {
				const program = createProgram(gl, FRAGMENT);
				if (!program) return undefined; // CSS gradient fallback shows through

				const uRes = gl.getUniformLocation(program, 'u_res');
				const uMouse = gl.getUniformLocation(program, 'u_mouse');
				const uTime = gl.getUniformLocation(program, 'u_time');

				return {
					frame() {
						const w = gl.drawingBufferWidth;
						const h = gl.drawingBufferHeight;
						const scale = w / env.width;
						gl.uniform2f(uRes, w, h);
						// gl_FragCoord's origin is bottom-left; the pointer's is top-left.
						gl.uniform2f(uMouse, env.pointer.x * scale, h - env.pointer.y * scale);
						gl.uniform1f(uTime, env.time);
						gl.drawArrays(gl.TRIANGLES, 0, 3);
					}
				};
			},
			{
				context: 'webgl',
				attributes: { alpha: false, antialias: false, powerPreference: 'high-performance' },
				maxDpr: 1.25, // five octaves of fbm per pixel; retina is not worth it here
				reducedFrames: 2
			}
		)
	);
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		display: block;
		/* Shown only if WebGL is unavailable and the canvas never gets drawn. */
		background:
			radial-gradient(70% 60% at 30% 30%, #7a1360 0%, transparent 60%),
			radial-gradient(60% 55% at 75% 70%, #c8542a 0%, transparent 55%),
			#0d0318;
	}
</style>
