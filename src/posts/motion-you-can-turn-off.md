---
title: Motion you can turn off
date: 2026-06-15
summary: This site is made almost entirely of movement. Here is what it does for the people who have asked their computer to stop moving things.
tags: [accessibility, canvas]
---

Every backdrop here animates continuously. For some people that is the point of
the site; for others it is the reason to close the tab, and a few of them will
have told their operating system so:

```css
@media (prefers-reduced-motion: reduce) {
	/* ... */
}
```

The lazy reading of that query is "turn the animation off". The better reading is
"don't animate, but still show me the thing" — a still frame of a flow field is
a rather nice image. So the rule I settled on is **settle, then freeze**.

## Settle, then freeze

Rather than skipping the render, the shared stage runs the scene for a fixed
budget of frames and then stops the loop:

```js
let budget = reduced ? 90 : Infinity;

function tick(now) {
	// ...advance and draw...
	if (--budget > 0) raf = requestAnimationFrame(tick);
	else raf = 0;
}
```

Ninety frames is roughly a second and a half. Long enough for the flow field to
develop its trails and the swarm to organise itself, short enough that nothing
is perceptibly *animating* — you get an image, not a movie.

Two consequences fall out of that, and both need handling:

- On resize the canvas is cleared, so a frozen scene would stay blank. Resize
  therefore refills the budget and restarts the loop.
- The pointer easing has to be disabled, because an eased value that only gets
  two frames never arrives anywhere. Under reduced motion the easing factor goes
  to `1` and the pointer snaps.

```js
const k = reduced ? 1 : ease;
p.x += (p.tx - p.x) * k;
```

## The interface still has to respond

Reduced motion is not "no feedback". Buttons still change colour on hover, the
scene dock still shows what's selected, and pointing at the canvas still nudges
out a couple of fresh frames:

```js
if (reduced && !raf) {
	budget = 2;
	schedule();
}
```

What goes away is everything decorative and unrequested: the entrance
animations, the parallax tilt on the hero card, the shimmer on the gradient
text, the smooth-scroll in the dock.

> Ask for less motion and you should get a calm, static, complete page — not a
> broken one.

## Testing it

You don't need to change your system settings to check this. In Chrome DevTools,
open the command palette and run **Show Rendering**, then set
`Emulate CSS prefers-reduced-motion` to `reduce`. Firefox has the same control
under the Inspector's accessibility panel.

Worth doing on every scene, because the failure mode is silent: a canvas that
freezes before it has drawn anything looks exactly like a canvas that crashed.
