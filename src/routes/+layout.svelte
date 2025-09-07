<script>
	import Navbar from '$lib/components/navbar.svelte';
	import '../app.css';
	/** @typedef {import('./$types').LayoutData} LayoutData */

	/**
	 * @type {{ data: LayoutData, children: any }}
	 */
	let { children, data } = $props();
</script>

<Navbar user={undefined} />
<main class="container py-8">
	{@render children()}
</main>
