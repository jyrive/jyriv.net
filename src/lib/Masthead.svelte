<script>
	import { resolve } from '$app/paths';

	/** @type {{ crumb?: string }} */
	let { crumb } = $props();
</script>

<header>
	<nav aria-label="Breadcrumb">
		<a class="mark" href={resolve('/')}>jyriv.net</a>
		<span class="sep" aria-hidden="true">/</span>
		<a class="crumb" href="{resolve('/blog')}/">writing</a>
		{#if crumb}
			<span class="sep" aria-hidden="true">/</span>
			<span class="crumb current" aria-current="page">{crumb}</span>
		{/if}
	</nav>
</header>

<style>
	header {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--faint);
		text-shadow: 0 1px 10px var(--bg);
	}

	nav {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		min-width: 0;
	}

	a {
		text-decoration: none;
		color: inherit;
		transition: color 0.18s ease;
	}

	a:hover {
		color: var(--fg);
	}

	.mark {
		letter-spacing: 0.4em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--mark);
	}

	.crumb {
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	/* The post title can be long — let it ellipsise rather than wrap the row. */
	.current {
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-transform: none;
		letter-spacing: 0.02em;
	}

	.sep {
		opacity: 0.5;
	}

	@media (max-width: 640px) {
		.current {
			display: none;
		}

		.sep:last-of-type {
			display: none;
		}
	}
</style>
