import { listPosts } from '$lib/posts.js';

// Runs at build time only — see the note in $lib/posts.js.
export function load() {
	return { posts: listPosts() };
}
