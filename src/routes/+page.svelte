<script>
	import FlowField from '$lib/FlowField.svelte';

	const links = [
		{ label: 'GitHub', href: 'https://github.com/jyrive' },
		{ label: 'Email', href: 'mailto:jyrive@gmail.com' }
	];
</script>

<svelte:head>
	<title>jyriv.net</title>
	<meta
		name="description"
		content="Jyri — experimenting across web, mobile, data, and AI. Interactive flow-field graphics built with SvelteKit."
	/>
</svelte:head>

<FlowField />

<main>
	<section class="hero">
		<p class="eyebrow">jyriv.net</p>
		<h1>
			Hi, I'm <span class="grad">Jyri</span>.<br />
			I experiment across
			<span class="grad">web, mobile, data &amp; AI</span>.
		</h1>
		<p class="lede">
			I like building things and following curiosity wherever it leads — from web and
			mobile apps to data pipelines and AI experiments.
		</p>

		<nav class="links" aria-label="Social links">
			{#each links as link (link.href)}
				<a href={link.href} target="_blank" rel="noreferrer noopener">
					{link.label}
				</a>
			{/each}
		</nav>
	</section>

	<footer>
		<span>Built with SvelteKit · rendered on an HTML5 canvas</span>
	</footer>
</main>

<style>
	main {
		position: relative;
		z-index: 1;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: clamp(1.5rem, 5vw, 5rem);
		pointer-events: none;
	}

	.hero {
		max-width: 40rem;
		margin-top: auto;
		margin-bottom: auto;
		padding: clamp(1.5rem, 3vw, 2.5rem);
		border-radius: 1.25rem;
		background: rgba(15, 15, 28, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(14px) saturate(140%);
		-webkit-backdrop-filter: blur(14px) saturate(140%);
		box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.6);
	}

	.eyebrow {
		margin: 0 0 1rem;
		font-size: 0.8rem;
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: rgba(180, 200, 255, 0.7);
	}

	h1 {
		margin: 0;
		font-size: clamp(2.2rem, 6vw, 4rem);
		line-height: 1.05;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.grad {
		background: linear-gradient(120deg, #4dd0e1, #7c9dff 45%, #c77dff);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.lede {
		margin: 1.5rem 0 0;
		font-size: clamp(1rem, 2.2vw, 1.2rem);
		line-height: 1.6;
		color: rgba(226, 232, 255, 0.78);
	}

	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 2rem;
		pointer-events: auto;
	}

	.links a {
		display: inline-flex;
		align-items: center;
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		font-size: 0.95rem;
		font-weight: 500;
		text-decoration: none;
		color: #e9edff;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		transition:
			transform 0.15s ease,
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.links a:hover {
		transform: translateY(-2px);
		background: rgba(124, 157, 255, 0.18);
		border-color: rgba(124, 157, 255, 0.5);
	}

	footer {
		margin-top: 2rem;
		font-size: 0.8rem;
		color: rgba(200, 210, 240, 0.45);
	}

	@media (prefers-reduced-motion: reduce) {
		.links a {
			transition: none;
		}
	}
</style>
