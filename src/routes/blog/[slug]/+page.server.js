import { error } from '@sveltejs/kit';
import { getPost, listPosts } from '$lib/posts.js';

/** Tells the prerenderer which slugs to emit. */
export function entries() {
	return listPosts().map((post) => ({ slug: post.slug }));
}

/** @type {import('./$types').PageServerLoad} */
export function load({ params }) {
	const post = getPost(params.slug);
	if (!post) error(404, `No post called "${params.slug}"`);

	// Neighbours for the footer, in the same newest-first order as the index.
	const posts = listPosts();
	const i = posts.findIndex((p) => p.slug === post.slug);

	return {
		post,
		newer: i > 0 ? posts[i - 1] : null,
		older: i < posts.length - 1 ? posts[i + 1] : null
	};
}
