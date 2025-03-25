<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { PageProps } from './$types';
	import BestPriceList from './best-price-list.svelte';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';
	import Filter from '$lib/components/filter.svelte';
	import AppliedFilters from '$lib/components/applied-filters.svelte';
	import Pagination from './pagination.svelte';

	let { data }: PageProps = $props();

	let selectedHouses = $derived(data.selectedHouses);
	let selectedGender = $derived(data.selectedGender);

	let query = $state(data.query);
	let timeout: NodeJS.Timeout;

	function handleSearch() {
		if (timeout) clearTimeout(timeout);

		timeout = setTimeout(search, 300);
	}

	function search() {
		const params = new URLSearchParams();
		if (query) {
			params.set('query', query);
		}
		if (selectedHouses && selectedHouses.length > 0) {
			params.set('houses', selectedHouses.join(','));
		}

		if (selectedGender && selectedGender.length > 0) {
			params.set('gender', selectedGender.join(','));
		}

		goto(`?${params.toString()}`, { keepFocus: true, invalidateAll: true });
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
	<div class="space-y-6">
		<div>
			<h2 class="mb-2 text-lg font-semibold">Търси</h2>
			<Input placeholder="Търси парфюм" bind:value={query} oninput={handleSearch} />
		</div>
		<Filter
			filterLabel="Марки"
			withSearch
			searchPlaceholder="Търси марка..."
			attributes={data.houses || []}
			bind:selectedAttributes={selectedHouses}
			onchange={handleSearch}
		/>
		<Filter
			filterLabel="Пол"
			attributes={['women', 'men', 'unisex']}
			bind:selectedAttributes={selectedGender}
			onchange={handleSearch}
		/>
	</div>
	<div>
		<div class="mb-6 flex justify-between">
			<h1 class="text-3xl font-bold">Парфюми</h1>
			<p class="text-zinc-500">Резултати: {data.total}</p>
		</div>
		<AppliedFilters />
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.perfumes || [] as perfume (perfume.id)}
				<Card class="flex flex-col">
					<a href={`/perfume/${perfume.id}`}>
						<img src={perfume.image_url} alt={perfume.name} class="h-48 w-full object-contain" />
						<CardHeader>
							<CardTitle>{perfume.name} {perfume.concentration}</CardTitle>
							<CardDescription>{perfume.house}</CardDescription>
						</CardHeader>
						<CardContent class="flex-1">
							<BestPriceList {perfume} />
						</CardContent>
					</a>
				</Card>
			{/each}
		</div>
		<Pagination />
		{#if !data.perfumes || data.perfumes.length === 0}
			<p class="mt-6 text-center text-muted-foreground">
				No perfumes found matching your criteria.
			</p>
		{/if}
	</div>
</div>
