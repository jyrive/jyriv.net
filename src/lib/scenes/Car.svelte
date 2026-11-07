<script>
	import { onMount } from 'svelte';
	import { createStage } from '$lib/stage.js';

	/** @type {HTMLCanvasElement} */
	let canvas;

	onMount(() =>
		createStage(canvas, (/** @type {CanvasRenderingContext2D} */ ctx, env) => {
			// A concrete object rather than a field: one car on a turntable in a
			// dark studio. The body is lofted through cross-sections, flat shaded,
			// back-face culled and painter-sorted.
			//
			// Detail is spent where recognition lives — the face, the pillars and
			// the shoulder line — and nowhere else. Canvas has no depth buffer, so
			// anything deeply concave would sort wrongly; every added detail here
			// is either coplanar with the nose, or convex and outside the body.

			// ---- Body sections --------------------------------------------------
			// [x along length, sill y, shoulder y, roof y, sill z, shoulder z, roof z]
			//
			// Scaled from the published dimensions with overall length = 2 units, so
			// 1 unit is 2329 mm. That fixes height at 0.696, wheelbase at 1.187, half
			// width at 0.403, and puts the axles at x = +0.622 and −0.565. Ground is
			// y = 0; the turntable offset in frame() re-centres it.
			//
			// Nose is +x. Stations come in pairs around each pillar so the glasshouse
			// can be cut into the real three-window DLO — front door, rear door, and
			// the quarter light that tapers away behind the C-pillar.
			const STATIONS = [
				[1.0, 0.095, 0.39, 0.39, 0.25, 0.345, 0.345], //    0 nose
				[0.93, 0.115, 0.402, 0.402, 0.315, 0.382, 0.382], // 1 lamp line
				[0.8, 0.132, 0.404, 0.404, 0.348, 0.398, 0.398], //  2 bonnet
				[0.622, 0.135, 0.404, 0.404, 0.362, 0.402, 0.402], // 3 front axle
				[0.4, 0.135, 0.403, 0.403, 0.366, 0.403, 0.403], //  4 cowl
				[0.16, 0.135, 0.4, 0.668, 0.366, 0.403, 0.296], //   5 A-pillar top
				[0.1, 0.135, 0.4, 0.674, 0.366, 0.403, 0.298], //    6 front door fwd
				[-0.14, 0.135, 0.404, 0.678, 0.366, 0.403, 0.3], //  7 B-pillar fwd
				[-0.2, 0.135, 0.408, 0.678, 0.365, 0.402, 0.3], //   8 B-pillar aft
				[-0.44, 0.14, 0.424, 0.674, 0.362, 0.399, 0.295], // 9 C-pillar fwd
				// The beltline kicks up hard through the quarter light so the glass
				// pinches to a point, the way it does on the reference.
				[-0.5, 0.142, 0.428, 0.668, 0.36, 0.397, 0.292], // 10 quarter light
				[-0.7, 0.15, 0.512, 0.64, 0.352, 0.388, 0.272], //  11 D-pillar
				[-0.85, 0.16, 0.462, 0.585, 0.332, 0.365, 0.256], // 12 tailgate
				[-1.0, 0.175, 0.395, 0.425, 0.272, 0.3, 0.258] //   13 tail
			];

			// Per bay: what the upper flanks are, and what the roofline is.
			const SIDE = [
				'paint', 'paint', 'paint', 'paint', 'pillar', 'pillar',
				'glass', 'pillar', 'glass', 'pillar', 'glass', 'pillar', 'paint'
			];
			const TOP = [
				'paint', 'paint', 'paint', 'paint', 'glass', 'paint',
				'paint', 'paint', 'paint', 'paint', 'paint', 'glass', 'paint'
			];

			/**
			 * Ten points round a section. Point 1 sits slightly proud of the
			 * shoulder — that is the crease down the flank, and flat shading turns
			 * the change of direction into a visible line.
			 * @param {number[]} s
			 */
			function section(s) {
				const [x, yb, ys, yt, zb, zs, zt] = s;
				const ym = yb + (ys - yb) * 0.56;
				const zc = zs * 1.022;
				return [
					[x, yb, -zb],
					[x, ym, -zc],
					[x, ys, -zs],
					[x, yt, -zt],
					[x, yt, zt],
					[x, ys, zs],
					[x, ym, zc],
					[x, yb, zb],
					[x, yb - 0.06, zb * 0.72],
					[x, yb - 0.06, -zb * 0.72]
				];
			}

			/** @type {number[][]} */
			const verts = [];
			/** `flat` faces are single-sided — never culled, normal flipped towards
			    the camera instead, and left to the depth sort. */
			/** @type {{ idx: number[], mat: string, emit?: string, flat?: boolean, bias?: number }[]} */
			const faces = [];

			const rings = STATIONS.map((s) => {
				const base = verts.length;
				for (const p of section(s)) verts.push(p);
				return base;
			});

			for (let bay = 0; bay < rings.length - 1; bay++) {
				const a = rings[bay];
				const b = rings[bay + 1];
				for (let e = 0; e < 10; e++) {
					const n = (e + 1) % 10;
					const mat =
						e === 3 ? TOP[bay]
						: e === 2 || e === 4 ? SIDE[bay]
						: e === 0 || e === 6 || e >= 7 ? 'clad'
						: 'paint';
					// Wound a→b along the length first. Going round the section first
					// yields inward normals on the −z flank, which back-face culling
					// then drops exactly when that side faces you — a hole in the near
					// flank at half of all viewing angles.
					faces.push({ idx: [a + e, b + e, b + n, a + n], mat });
				}
			}

			const last = rings[rings.length - 1];
			faces.push({ idx: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rings[0] + i), mat: 'paint' });
			faces.push({ idx: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((i) => last + i), mat: 'paint' });

			// ---- Helpers ---------------------------------------------------------

			/**
			 * A flat rectangle on the nose or the tail. The z bounds get sorted
			 * before winding: callers pass them mirrored for left and right, which
			 * would otherwise hand half of them an inverted normal and leave the
			 * headlamps glowing on a rear view.
			 *
			 * @param {number} dir  +1 faces forward, -1 faces aft
			 * @param {number} x @param {number} y0 @param {number} y1
			 * @param {number} za @param {number} zb
			 * @param {string} mat @param {string} [emit]
			 */
			function panel(dir, x, y0, y1, za, zb, mat, emit) {
				const z0 = Math.min(za, zb);
				const z1 = Math.max(za, zb);
				const base = verts.length;
				verts.push([x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]);
				// Sorted-z winding yields a −x normal, so forward-facing panels are
				// the ones that need reversing.
				const idx = [base, base + 1, base + 2, base + 3];
				// The cap behind this panel is one big polygon spanning the full
				// width, so its centroid can sort in front of detail sitting at the
				// outboard end — which loses the far tail lamp on a rear view. These
				// panels only exist when their end faces you, so biasing them
				// forward past the cap's half-width is safe.
				faces.push({ idx: dir > 0 ? idx.reverse() : idx, mat, emit, bias: 0.34 });
			}

			/**
			 * A convex box with outward normals — safe for the painter's sort.
			 * @param {number} xa @param {number} xb @param {number} ya @param {number} yb2
			 * @param {number} za @param {number} zb2 @param {string} mat
			 */
			function box(xa, xb, ya, yb2, za, zb2, mat) {
				const [x0, x1] = xa < xb ? [xa, xb] : [xb, xa];
				const [y0, y1] = ya < yb2 ? [ya, yb2] : [yb2, ya];
				const [z0, z1] = za < zb2 ? [za, zb2] : [zb2, za];
				const b = verts.length;
				verts.push(
					[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0],
					[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]
				);
				const q = (/** @type {number[]} */ i) => faces.push({ idx: i.map((n) => b + n), mat });
				q([0, 3, 2, 1]); // −z
				q([5, 6, 7, 4]); // +z
				q([4, 7, 3, 0]); // −x
				q([1, 2, 6, 5]); // +x
				q([0, 1, 5, 4]); // −y
				q([7, 6, 2, 3]); // +y
			}

			// ---- Front fascia -----------------------------------------------------
			// Coplanar at the nose, so none of it can sort wrongly, and it carries
			// more recognition than any amount of surfacing: one very thin full-width
			// light line at the bonnet shut, a ribbed black panel below it, then two
			// small square lamps per side set low and outboard.
			panel(1, 1.002, 0.05, 0.165, -0.265, 0.265, 'clad'); // lower intake
			panel(1, 1.004, 0.185, 0.348, -0.285, 0.285, 'deck'); // black nose panel

			for (let i = 0; i < 11; i++) {
				const z = -0.245 + i * 0.0475;
				panel(1, 1.007, 0.2, 0.335, z, z + 0.016, 'rib');
			}

			panel(1, 1.011, 0.352, 0.368, -0.278, 0.278, 'lamp', '#e8f4ff'); // light line
			panel(-1, -1.004, 0.235, 0.25, -0.2, 0.2, 'redtrim'); // rear reflector strip

			for (const sgn of [1, -1]) {
				panel(1, 1.011, 0.212, 0.258, sgn * 0.15, sgn * 0.192, 'lamp', '#dceeff');
				panel(1, 1.011, 0.212, 0.258, sgn * 0.202, sgn * 0.244, 'lamp', '#dceeff');

				// Rear: a wide horizontal lamp with an outboard return, reading as
				// the arrow rather than the little C I had before.
				panel(-1, -1.006, 0.312, 0.348, sgn * 0.11, sgn * 0.268, 'lamp', '#ff5a4a');
				panel(-1, -1.006, 0.286, 0.312, sgn * 0.208, sgn * 0.268, 'lamp', '#ff5a4a');

				// Mirrors sit at the base of the A-pillar, on the beltline.
				box(0.115, 0.155, 0.404, 0.432, sgn * 0.395, sgn * 0.44, 'clad');
				box(0.08, 0.18, 0.396, 0.45, sgn * 0.428, sgn * 0.472, 'clad');
			}

			// Roof spoiler over the tailgate — a strong part of the rear silhouette.
			box(-0.82, -0.68, 0.626, 0.652, -0.265, 0.265, 'pillar');

			// ---- Wheels -----------------------------------------------------------
			// A 21in rim on a 235/45 tyre is 745 mm across, which is 0.16 at this
			// scale. The axles come straight from the wheelbase and overhangs.
			const WHEEL_R = 0.16;
			const WHEEL_Y = 0.16;
			const SEG = 12;

			for (const wx of [0.622, -0.565]) {
				for (const sgn of [1, -1]) {
					const outer = sgn * 0.4;
					const inner = sgn * 0.31;
					// The arch sits a hair outside the flank, so the depth sort puts
					// it over the near side of the body and under the far side.
					const archZ = sgn * 0.416;
					const base = verts.length;

					for (let i = 0; i < SEG; i++) {
						const a = (i / SEG) * Math.PI * 2;
						const ca = Math.cos(a);
						const sa = Math.sin(a);
						verts.push([wx + ca * WHEEL_R, WHEEL_Y + sa * WHEEL_R, outer]); // tyre out
						verts.push([wx + ca * WHEEL_R, WHEEL_Y + sa * WHEEL_R, inner]); // tyre in
						verts.push([wx + ca * WHEEL_R * 0.86, WHEEL_Y + sa * WHEEL_R * 0.86, outer]); // rim
						verts.push([wx + ca * 0.172, WHEEL_Y + sa * 0.172, archZ]); // arch inner lip
						verts.push([wx + ca * 0.205, WHEEL_Y + sa * 0.205, archZ]); // arch outer lip
					}

					for (let i = 0; i < SEG; i++) {
						const c = base + i * 5;
						const d = base + ((i + 1) % SEG) * 5;
						faces.push({ idx: [c, d, d + 1, c + 1], mat: 'tyre' }); // tread
						faces.push({ idx: [c, c + 2, d + 2, d], mat: 'tyre' }); // sidewall

						// Cladding over the arch — the upper arc only. A full ring
						// carries on below the rocker and reads as a floating donut.
						const a0 = (i / SEG) * Math.PI * 2;
						const a1 = ((i + 1) / SEG) * Math.PI * 2;
						if (Math.sin(a0) > -0.12 && Math.sin(a1) > -0.12) {
							faces.push({ idx: [c + 3, c + 4, d + 4, d + 3], mat: 'clad', flat: true });
						}
					}

					// Rim face, then five aero spokes over it. Everything here is at
					// one z, and the sort is stable, so insertion order is the paint
					// order and no depth fight is possible.
					faces.push({
						idx: Array.from({ length: SEG }, (_, i) => base + i * 5 + 2),
						mat: 'rimdark',
						flat: true
					});

					for (let s = 0; s < 5; s++) {
						const a = (s / 5) * Math.PI * 2 + 0.3;
						const spoke = verts.length;
						for (const [r, halfW] of [
							[0.3, 0.11],
							[0.82, 0.2]
						]) {
							for (const side of [-1, 1]) {
								const t = a + side * halfW;
								verts.push([
									wx + Math.cos(t) * WHEEL_R * r,
									WHEEL_Y + Math.sin(t) * WHEEL_R * r,
									outer
								]);
							}
						}
						faces.push({ idx: [spoke, spoke + 1, spoke + 3, spoke + 2], mat: 'rim', flat: true });
					}
				}
			}

			// ---- Materials ---------------------------------------------------------
			const MATS = {
				paint: { base: [34, 44, 58], hi: [176, 206, 234], rim: 0.55 },
				glass: { base: [10, 14, 21], hi: [92, 124, 158], rim: 0.35 },
				pillar: { base: [15, 18, 24], hi: [56, 66, 80], rim: 0.25 },
				clad: { base: [22, 25, 31], hi: [70, 80, 94], rim: 0.2 },
				tyre: { base: [12, 13, 16], hi: [54, 58, 66], rim: 0.25 },
				rim: { base: [58, 66, 79], hi: [176, 192, 212], rim: 0.4 },
				rimdark: { base: [24, 28, 35], hi: [78, 88, 102], rim: 0.3 },
				deck: { base: [8, 10, 14], hi: [96, 126, 160], rim: 0.9 },
				rib: { base: [26, 31, 40], hi: [126, 152, 184], rim: 0.5 },
				redtrim: { base: [122, 26, 26], hi: [226, 74, 62], rim: 0.4 }
			};

			/** Scratch space — transformed once per frame, reused by every face. */
			const world = verts.map(() => [0, 0, 0]);
			const screen = verts.map(() => [0, 0]);

			let cx = 0;
			let cy = 0;
			let projScale = 400;

			// Sweeping the pointer across the window turns the car rather more than
			// once, so every angle is reachable without hunting for the edge.
			const BASE_YAW = -0.55;
			const SWEEP = Math.PI * 2.3;
			/** Eased, so the car follows the pointer instead of snapping to it. */
			let yaw = BASE_YAW;
			/** Showroom turntable, until the visitor takes over. */
			let idle = 0;

			return {
				resize() {
					projScale = Math.min(env.width * 0.42, env.height * 0.82);
					// Right of centre — the hero card sits on the left.
					cx = env.width * (env.width < 760 ? 0.5 : 0.62);
					cy = env.height * (env.width < 760 ? 0.46 : 0.54);
				},

				frame() {
					const { width, height, time, pointer } = env;

					// Studio: a dark wall falling to a slightly lifted floor.
					const room = ctx.createLinearGradient(0, 0, 0, height);
					room.addColorStop(0, '#070910');
					room.addColorStop(0.58, '#0b0e16');
					room.addColorStop(1, '#141924');
					ctx.fillStyle = room;
					ctx.fillRect(0, 0, width, height);

					// It turns itself until you touch it; after that the pointer owns
					// the angle outright and you can bring it all the way round.
					if (!pointer.moved) idle += 0.006 * env.dt;
					const target = pointer.moved
						? BASE_YAW + (0.5 - pointer.nx) * SWEEP
						: BASE_YAW + idle;

					// A frozen reduced-motion stage only gets a couple of frames per
					// pointer move, which easing would never traverse.
					yaw += env.reduced ? target - yaw : (target - yaw) * Math.min(1, 0.09 * env.dt);

					// Never entirely still, even when nobody is steering.
					const yawNow = yaw + Math.sin(time * 0.35) * 0.03;
					const pitch = 0.17 + (0.5 - pointer.ny) * 0.62;
					const cyw = Math.cos(yawNow);
					const syw = Math.sin(yawNow);
					const cp = Math.cos(pitch);
					const sp = Math.sin(pitch);
					const camZ = 3.4;

					// The ground is wherever the tyres actually land once projected —
					// deriving it from the geometry rather than guessing is the only
					// way the shadow stays under the car at every angle.
					let floorY = 0;

					for (let i = 0; i < verts.length; i++) {
						const v = verts[i];
						const x = v[0] * cyw + v[2] * syw;
						const zr = -v[0] * syw + v[2] * cyw;
						// Ground is y = 0 in the data; drop it to centre on the turntable.
						const y = v[1] - 0.35;
						const w = world[i];
						w[0] = x;
						w[1] = y * cp - zr * sp;
						w[2] = y * sp + zr * cp + camZ;

						const s = (1.9 * projScale) / w[2];
						screen[i][0] = cx + w[0] * s;
						const sy = cy - w[1] * s;
						screen[i][1] = sy;
						if (sy > floorY) floorY = sy;
					}

					const pool = ctx.createRadialGradient(cx, floorY, 0, cx, floorY, projScale * 0.95);
					pool.addColorStop(0, 'rgba(96, 132, 176, 0.17)');
					pool.addColorStop(1, 'rgba(96, 132, 176, 0)');
					ctx.fillStyle = pool;
					ctx.fillRect(0, 0, width, height);

					// Contact shadow, before the car.
					ctx.save();
					ctx.translate(cx, floorY);
					ctx.scale(1, 0.2);
					const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, projScale * 0.52);
					shade.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
					shade.addColorStop(1, 'rgba(0, 0, 0, 0)');
					ctx.fillStyle = shade;
					ctx.beginPath();
					ctx.arc(0, 0, projScale * 0.52, 0, Math.PI * 2);
					ctx.fill();
					ctx.restore();

					// Key light swings with the turntable so highlights stay put.
					const lx = Math.cos(yawNow + 0.9);
					const lz = Math.sin(yawNow + 0.9);

					/** @type {{ f: any, z: number, n: number[] }[]} */
					const draw = [];

					for (const f of faces) {
						const a = world[f.idx[0]];
						const b = world[f.idx[1]];
						const c = world[f.idx[2]];
						const ux = b[0] - a[0];
						const uy = b[1] - a[1];
						const uz = b[2] - a[2];
						const vx = c[0] - a[0];
						const vy = c[1] - a[1];
						const vz = c[2] - a[2];
						let nx = uy * vz - uz * vy;
						let ny = uz * vx - ux * vz;
						let nz = ux * vy - uy * vx;
						const len = Math.hypot(nx, ny, nz) || 1;
						nx /= len;
						ny /= len;
						nz /= len;

						let z = 0;
						let px = 0;
						let py = 0;
						for (const i of f.idx) {
							px += world[i][0];
							py += world[i][1];
							z += world[i][2];
						}
						px /= f.idx.length;
						py /= f.idx.length;
						z /= f.idx.length;

						// Away-facing polygons never reach the sort — including the
						// lamps, so the tail lights stop glowing through the bonnet.
						const vl = Math.hypot(px, py, z) || 1;
						let facing = (nx * px + ny * py + nz * z) / vl;
						if (facing > 0) {
							if (!f.flat) continue;
							nx = -nx;
							ny = -ny;
							nz = -nz;
							facing = -facing;
						}

						draw.push({ f, z: z - (f.bias ?? 0), n: [nx, ny, nz, facing] });
					}

					// Stable sort, so coplanar detail keeps its insertion order.
					draw.sort((p, q) => q.z - p.z);

					for (const d of draw) {
						const { f } = d;
						const [nx, ny, nz, facing] = d.n;
						const m = MATS[/** @type {keyof typeof MATS} */ (f.mat)];

						let t;
						if (f.emit) {
							t = 1;
						} else {
							const key = Math.max(0, nx * lx + ny * 0.72 + nz * lz);
							const fill = Math.max(0, -nx * lx + ny * 0.35 - nz * lz) * 0.3;
							// Grazing faces catch the studio's edge light.
							const edge = Math.pow(1 - Math.min(1, Math.abs(facing)), 3) * m.rim;
							t = Math.min(1, 0.13 + key * 0.76 + fill + edge);
						}

						ctx.beginPath();
						const p0 = screen[f.idx[0]];
						ctx.moveTo(p0[0], p0[1]);
						for (let i = 1; i < f.idx.length; i++) {
							const p = screen[f.idx[i]];
							ctx.lineTo(p[0], p[1]);
						}
						ctx.closePath();

						if (f.emit) {
							ctx.fillStyle = f.emit;
						} else {
							const r = Math.round(m.base[0] + (m.hi[0] - m.base[0]) * t);
							const g = Math.round(m.base[1] + (m.hi[1] - m.base[1]) * t);
							const bl = Math.round(m.base[2] + (m.hi[2] - m.base[2]) * t);
							ctx.fillStyle = `rgb(${r}, ${g}, ${bl})`;
						}
						ctx.fill();
					}

					// Bloom on the lamps, once everything solid is down. Twelve of
					// them stack under 'lighter', so each has to stay modest.
					ctx.globalCompositeOperation = 'lighter';
					for (const d of draw) {
						if (!d.f.emit) continue;
						let sx = 0;
						let sy = 0;
						for (const i of d.f.idx) {
							sx += screen[i][0];
							sy += screen[i][1];
						}
						sx /= d.f.idx.length;
						sy /= d.f.idx.length;

						const r = projScale * 0.05;
						const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
						g.addColorStop(0, `${d.f.emit}34`);
						g.addColorStop(1, `${d.f.emit}00`);
						ctx.fillStyle = g;
						ctx.beginPath();
						ctx.arc(sx, sy, r, 0, Math.PI * 2);
						ctx.fill();
					}
					ctx.globalCompositeOperation = 'source-over';
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
