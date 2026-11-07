---
title: A blog with no backend
date: 2026-08-11
summary: The whole publishing pipeline is a folder of markdown files and a git push. No database, no CMS, no server, no bill.
tags: [meta, sveltekit]
---

Every few years I talk myself into needing "a proper backend" for a personal
site, and every few years I remember that a personal site is a handful of
documents that change about once a month. The right amount of infrastructure for
that is none.

So this blog is a folder:

```
src/posts/
  a-blog-with-no-backend.md
  flow-fields-in-a-hundred-lines.md
  motion-you-can-turn-off.md
```

Every file gets read at build time, parsed, and baked into static HTML. There is
no server at runtime — GitHub Pages hands out files, and that is the entire
architecture.

## How a post becomes a page

Vite can glob the filesystem at build time, which is the only trick involved:

```js
const sources = import.meta.glob('/src/posts/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
});
```

That runs inside a `+page.server.js`, so it never reaches the browser. The
markdown renderer never reaches the browser either. What the browser gets is the
finished HTML, prerendered, which means the blog costs exactly zero runtime
JavaScript on top of what the backdrop already spends.

The front matter is deliberately dull — a title, a date, a summary, some tags:

```
---
title: A blog with no backend
date: 2026-08-11
tags: [meta, sveltekit]
---
```

Twenty lines of parsing handles it. YAML is a lovely idea until you need to
explain [the Norway problem](https://hitchdev.com/strictyaml/why/implicit-typing-removed/)
to yourself at midnight.

## Publishing

There is no admin panel, and I have stopped pretending I want one. Publishing is:

1. Write a markdown file.
2. `git push`.
3. The Actions workflow builds and deploys, about a minute later.

If I'm away from my laptop, GitHub's own web editor is a perfectly good phone
CMS. It has a text box and a commit button, which is a complete description of
what a blog editor needs to be.

> The best CMS is the one you already have credentials for.

## What it costs

| Piece | Cost |
| ----- | ---- |
| Hosting | £0 — GitHub Pages |
| Build minutes | £0 — public repo |
| Database | there isn't one |
| Domain | the one real expense |

The tradeoff is real, and worth naming: there is no way to publish without git,
comments would need a third party, and every edit is a full site rebuild. For
something I update a few times a month, none of those are costs I can feel.

---

The nice side effect is that the whole blog is greppable, diffable, and mine. If
this site vanishes tomorrow, the posts are still a folder of plain text that any
editor written in the last forty years can open.
