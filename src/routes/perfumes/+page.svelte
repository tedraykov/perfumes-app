<script>
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	/** @typedef {import('./$types').PageData} PageData */
	let { data } = $props();
	let perfumes = data.perfumes;

	/** @type {string[]} */
	let brands = [];
	let searchQuery = '';
	/** @type {Set<string>} */
	let selectedBrands = new Set();

	/**
	 * @param {string} brand
	 */
	function toggleBrand(brand) {
		if (selectedBrands.has(brand)) {
			selectedBrands.delete(brand);
		} else {
			selectedBrands.add(brand);
		}
		selectedBrands = selectedBrands; // trigger reactivity
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
	<div class="space-y-6">
		<div>
			<h2 class="mb-2 text-lg font-semibold">Search</h2>
			<Input type="text" placeholder="Search perfumes..." bind:value={searchQuery} />
		</div>
		<div>
			<h2 class="mb-2 text-lg font-semibold">Brands</h2>
			<div class="space-y-2">
				{#each brands as brand}
					<div class="flex items-center space-x-2">
						<Checkbox
							id={brand}
							checked={selectedBrands.has(brand)}
							on:change={() => toggleBrand(brand)}
						/>
						<Label for={brand}>{brand}</Label>
					</div>
				{/each}
			</div>
		</div>
	</div>
	<div>
		<h1 class="mb-6 text-3xl font-bold">Perfumes</h1>
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each perfumes as perfume (perfume.name)}
				<Card>
					<img src={perfume.image} alt={perfume.name} class="h-48 w-full object-contain" />
					<CardHeader>
						<CardTitle>{perfume.name}</CardTitle>
						<CardDescription>{perfume.house}</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground">Notes: {perfume.notes.join(', ')}</p>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full">View Details</Button>
					</CardFooter>
				</Card>
			{/each}
		</div>
		{#if perfumes.length === 0}
			<p class="mt-6 text-center text-muted-foreground">
				No perfumes found matching your criteria.
			</p>
		{/if}
	</div>
</div>
