---
title: Flow fields in about a hundred lines
date: 2026-07-28
summary: Noise in, velocity out. The first backdrop on this site is a few hundred particles that never ask where they are going.
tags: [canvas, graphics]
---

The first backdrop on this site — press <kbd>1</kbd> if you're on another one —
is a flow field. It looks like smoke or ink or ocean current depending on the
palette, and it is one of the cheapest interesting things you can draw.

The whole idea: sample a noise function at each particle's position, treat the
value as an angle, and step the particle that way. Do it every frame for a few
hundred particles and structure appears out of nothing.

## The core of it

```js
const SCALE = 0.0016;

for (const p of particles) {
	const angle = noise(p.x * SCALE, p.y * SCALE, time * 0.08) * Math.PI * 2;

	p.px = p.x;
	p.py = p.y;
	p.x += Math.cos(angle) * p.speed;
	p.y += Math.sin(angle) * p.speed;

	ctx.beginPath();
	ctx.moveTo(p.px, p.py);
	ctx.lineTo(p.x, p.y);
	ctx.stroke();
}
```

That's it. Everything else is taste.

### Three knobs that matter

- **`SCALE`** decides how big the swirls are. Larger values give you turbulent
  noise; smaller ones give you long, lazy currents. `0.0016` is roughly
  "one swirl per thumb".
- **The time term** keeps the field itself evolving, so the pattern never settles
  into a still photograph. Slow — an order of magnitude slower than the particles.
- **Particle count** scales with viewport area, capped at both ends:

```js
const count = Math.min(1600, Math.max(400, (width * height) / 1500));
```

## Trails without a trail buffer

The obvious way to get trails is to keep the last N positions per particle. The
much cheaper way is to never clear the canvas, and instead paint a nearly
transparent rectangle over the whole thing each frame:

```js
ctx.fillStyle = 'rgba(8, 8, 15, 0.06)';
ctx.fillRect(0, 0, width, height);
```

Old strokes fade toward the background colour on their own. The alpha is the
only dial: `0.02` gives long comet tails, `0.15` is nearly trailless. It looks
like motion blur and costs one fill.

> This is the trick that makes the whole thing feel expensive. Everything else in
> the scene is a straight line between two points.

## Letting the cursor stir it

The pointer adds a radial term to the angle, falling off with distance:

```js
const dx = p.x - pointer.x;
const dy = p.y - pointer.y;
const d2 = dx * dx + dy * dy;

if (d2 < 260 * 260) {
	const push = 1 - Math.sqrt(d2) / 260;
	p.x += (dx / Math.sqrt(d2)) * push * 2.4;
	p.y += (dy / Math.sqrt(d2)) * push * 2.4;
}
```

Two details make this feel good rather than twitchy. The pointer position is
eased toward its target rather than snapped — the shared stage does this for
every scene — and the falloff is linear in distance, not in distance squared, so
the influence has a soft edge instead of a hard bubble.

## Respawning

Particles drift out of frame and into knots. Give each one a lifespan, and reset
it somewhere random when it expires or leaves the viewport:

```js
if (--p.life < 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
	reset(p);
}
```

Stagger the initial lifespans, or every particle in the field respawns on the
same frame and the whole image blinks. That one line took me longer to find than
the rest of the scene put together.
