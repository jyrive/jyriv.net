/**
 * The chosen backdrop, shared by every route.
 *
 * This lives outside the layout component so pages can read the current scene
 * (to re-key an animation, say) without threading props through a snippet.
 */

import { replaceState } from '$app/navigation';
import { scenes, resolveScene, STORAGE_KEY } from './scenes/index.js';

class SceneState {
	current = $state(scenes[0].id);
	/** False until the client has read the URL and localStorage. */
	mounted = $state(false);

	get active() {
		return resolveScene(this.current);
	}

	/** Adopt the scene named in `?s=`, else the one from last visit. */
	adopt() {
		const fromUrl = new URLSearchParams(location.search).get('s');
		let stored = null;
		try {
			stored = localStorage.getItem(STORAGE_KEY);
		} catch {
			// Private browsing — the default scene is fine.
		}
		this.current = resolveScene(fromUrl ?? stored).id;
		this.mounted = true;
	}

	/** Mirror the choice into the palette and storage. */
	persist() {
		const root = document.documentElement;
		root.setAttribute('data-scene', this.current);

		// Keep mobile browser chrome in step — one palette is a daylight one.
		const meta = document.querySelector('meta[name="theme-color"]');
		const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
		if (meta && bg) meta.setAttribute('content', bg);

		try {
			localStorage.setItem(STORAGE_KEY, this.current);
		} catch {
			// Ignore — persistence is a nicety, not a requirement.
		}
	}

	/**
	 * Mirror the choice into the shareable URL. Goes through SvelteKit's router
	 * rather than `history` directly — the two conflict — which means it can
	 * only run once the router is up. See the caller in `+layout.svelte`.
	 */
	syncUrl() {
		const url = new URL(location.href);
		if (url.searchParams.get('s') === this.current) return;
		url.searchParams.set('s', this.current);
		replaceState(url, {});
	}

	/** @param {number} delta */
	step(delta) {
		const i = scenes.findIndex((s) => s.id === this.current);
		this.current = scenes[(i + delta + scenes.length) % scenes.length].id;
	}
}

export const scene = new SceneState();
