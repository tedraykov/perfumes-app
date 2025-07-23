<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { PerfumeWithInventory, InventoryWithWebsite } from '$lib/server/db/schema';
	import { toMoney } from '$lib/utils';

	let { perfume }: { perfume: PerfumeWithInventory } = $props();

	function deriveBestPricePerVolume(perfume: PerfumeWithInventory) {
		const bestPricePerVolume: { [volume: number]: InventoryWithWebsite } = {};
		for (const inventory of perfume.inventory) {
			if (!inventory.volume || !inventory.price) continue;

			if (
				!bestPricePerVolume[inventory.volume] ||
				(bestPricePerVolume[inventory.volume].price || Infinity) > inventory.price
			) {
				bestPricePerVolume[inventory.volume] = inventory;
			}
		}
		return Object.values(bestPricePerVolume);
	}
</script>

<ul class="flex flex-col gap-2">
	{#each deriveBestPricePerVolume(perfume) as inventory}
		<Separator />
		<li>
			<div class="flex items-center gap-1">
				<span>{inventory.volume} мл.</span>
				<span>от</span>
				<strong>{toMoney(inventory.price)}</strong>
				<div class="flex flex-1 justify-end">
					{#if inventory.website}
						<img
							src={inventory.website.logo}
							alt={inventory.website.name}
							class="h-10 object-contain"
						/>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
