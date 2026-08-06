/**
 * A small, dependency-free 2D gradient noise — enough for flow fields and
 * rolling terrain without pulling in a library.
 *
 * @param {number} [seed]
 * @returns {(x: number, y: number) => number} value in roughly [-1, 1]
 */
export function createNoise(seed = 1) {
	const perm = new Uint8Array(512);
	const p = new Uint8Array(256);
	for (let i = 0; i < 256; i++) p[i] = i;

	// Deterministic shuffle so a given seed always yields the same field.
	let s = seed >>> 0 || 1;
	const rand = () => {
		s ^= s << 13;
		s ^= s >>> 17;
		s ^= s << 5;
		return (s >>> 0) / 4294967296;
	};
	for (let i = 255; i > 0; i--) {
		const j = (rand() * (i + 1)) | 0;
		const tmp = p[i];
		p[i] = p[j];
		p[j] = tmp;
	}
	for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

	/** @param {number} t */
	const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
	/** @param {number} a @param {number} b @param {number} t */
	const lerp = (a, b, t) => a + (b - a) * t;
	/** @param {number} h @param {number} x @param {number} y */
	const grad = (h, x, y) => (h & 1 ? x : -x) + (h & 2 ? y : -y);

	return function noise(x, y) {
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
	};
}
