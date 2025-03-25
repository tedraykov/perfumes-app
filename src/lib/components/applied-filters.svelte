<script lang="ts">
	import { Badge } from './ui/badge';
	import { Button } from './ui/button';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let houses = $derived<string[]>($page.data.selectedHouses);
	let genders = $derived<string[]>($page.data.selectedGender);
	let query = $derived($page.data.query);

	function updateFilters() {
		const params = new URLSearchParams();

		if (query) {
			params.set('query', query);
		} else {
			params.delete('query');
		}

		if (houses.length > 0) {
			params.set('houses', houses.join(','));
		} else {
			params.delete('houses');
		}

		if (genders.length > 0) {
			params.set('gender', genders.join(','));
		} else {
			params.delete('gender');
		}

		goto(`?${params.toString()}`, {
			invalidateAll: true
		});
	}

	function clearHouse(house: string) {
		houses = houses.filter((h) => h !== house);
		updateFilters();
	}

	function clearGender(gender: string) {
		genders = genders.filter((g) => g !== gender);
		updateFilters();
	}

	function clearFilters() {
		houses = [];
		genders = [];
		query = '';

		updateFilters();
	}
</script>

{#if houses.length > 0 || genders.length > 0 || query}
	<div class="mb-4 flex gap-2">
		<div class="flex flex-col gap-2">
			{#if query}
				<div>
					<strong>Търсене:</strong>
					<span>{query}</span>
				</div>
			{/if}
			{#if houses.length > 0}
				<div>
					<strong>Марка:</strong>
					<ul class="flex gap-2">
						{#each houses as house}
							<li>
								<Badge
									tabindex="1"
									class="cursor-pointer"
									variant="outline"
									onclick={() => clearHouse(house)}>{house} x</Badge
								>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if genders.length > 0}
				<div>
					<strong>Пол:</strong>
					<ul class="flex gap-2">
						{#each genders as gender}
							<li>
								<Badge
									tabindex="1"
									class="cursor-pointer"
									variant="outline"
									onclick={() => clearGender(gender)}>{gender} x</Badge
								>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<div class="flex flex-1 justify-end">
			<Button onclick={clearFilters} size="sm" variant="secondary">Изчисти всички филтри</Button>
		</div>
	</div>
{/if}
