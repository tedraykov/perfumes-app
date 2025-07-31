<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ExternalIcon from '@lucide/svelte/icons/external-link';
	import type { PageProps } from './$types';
	import Scraper, { type ScraperProps } from './scraper.svelte';

	let { data }: PageProps = $props();

	const scrapers: ScraperProps[] = [
		{
			name: 'Import Elinor',
			description: 'Extract all inventory from Elinor',
			action: 'import-elinor'
		},
		{
			name: 'Import parfium.bg',
			description: 'Extract all inventory from parfium.bg',
			action: 'import-parfiumbg'
		}
	];

	let groupedJobs = $derived(data.groupedJobs);
</script>

<div class="mx-auto flex max-w-screen-sm flex-col gap-4">
	<div class="flex justify-between">
		<h1 class="text-3xl font-semibold leading-tight">Scrapers</h1>
		<Button href="/jobs" target="_blank">Jobs Portal<ExternalIcon /></Button>
	</div>
	{#each scrapers as scraper}
		<Scraper
			name={scraper.name}
			description={scraper.description}
			action={scraper.action}
			jobs={groupedJobs[scraper.action]}
		/>
	{/each}
	<!-- <div class="flex flex-col gap-2"> -->
	<!-- 	<form method="POST" action="?/import-elinor"> -->
	<!-- 		<Button type="submit">Elinor</Button> -->
	<!-- 	</form> -->
	<!-- 	<form method="POST" action="?/link-to-fragrantica"> -->
	<!-- 		<Button type="submit">Link Perfumes to Fragrantica</Button> -->
	<!-- 	</form> -->
	<!-- 	<form method="POST" action="?/import-parfiumbg"> -->
	<!-- 		<Button type="submit">Parfium.bg</Button> -->
	<!-- 	</form> -->
	<!-- 	<form method="POST" action="?/import-parfiumbg-one"> -->
	<!-- 		<Input name="url" required /> -->
	<!-- 		<Button type="submit">Parfium.bg Single</Button> -->
	<!-- 	</form> -->
	<!-- </div> -->
</div>
