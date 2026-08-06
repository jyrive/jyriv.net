<script>
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(*),
	:global(*::before),
	:global(*::after) {
		box-sizing: border-box;
	}

	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
	}

	:global(body) {
		min-height: 100dvh;
		background: #0a0a12;
		color: #e9edff;
		font-family:
			'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		overflow-x: hidden;
	}

	:global(::selection) {
		background: rgba(124, 157, 255, 0.35);
	}
</style>
