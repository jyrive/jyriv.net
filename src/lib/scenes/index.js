import FlowField from './FlowField.svelte';
import Plasma from './Plasma.svelte';
import Swarm from './Swarm.svelte';
import Synth from './Synth.svelte';
import Car from './Car.svelte';

/**
 * The backdrops you can switch between. `id` doubles as the `?s=` query value
 * and the `data-scene` attribute that drives each palette in +layout.svelte.
 *
 * @typedef {object} Scene
 * @property {string} id
 * @property {string} name
 * @property {string} tagline
 * @property {[string, string]} swatch  colours for the switcher's chip
 * @property {import('svelte').Component} component
 */

/** @type {Scene[]} */
export const scenes = [
	{
		id: 'flow',
		name: 'Flow field',
		tagline: 'Noise currents you can stir with the cursor.',
		swatch: ['#4dd0e1', '#c77dff'],
		component: FlowField
	},
	{
		id: 'plasma',
		name: 'Plasma',
		tagline: 'A domain-warped shader that folds around your thumb.',
		swatch: ['#ff5ec7', '#ff9f43'],
		component: Plasma
	},
	{
		id: 'swarm',
		name: 'Swarm',
		tagline: 'A few hundred boids orbiting whatever you point at.',
		swatch: ['#7ae7ff', '#ffffff'],
		component: Swarm
	},
	{
		id: 'synth',
		name: 'Outrun',
		tagline: 'An endless neon grid and a sun that never quite sets.',
		swatch: ['#ff2e94', '#78fff6'],
		component: Synth
	},
	{
		id: 'car',
		name: 'Car',
		tagline: 'A car on a turntable. Sweep across to turn it right round.',
		swatch: ['#5fd3a3', '#cfe4ff'],
		component: Car
	}
];

export const DEFAULT_SCENE = scenes[0].id;
export const STORAGE_KEY = 'jyriv:scene';

/** @param {string | null | undefined} id */
export function resolveScene(id) {
	return scenes.find((s) => s.id === id) ?? scenes[0];
}
