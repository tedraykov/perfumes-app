<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import type { Database } from '$lib/server/supabase/types';
	import { toMoney } from '$lib/utils';

	type Website = Database['public']['Tables']['websites']['Row'];

	type PerfumeInventory = Database['public']['Tables']['perfume_inventory']['Row'] & {
		websites: Website | null;
	};

	type Perfume = Database['public']['Tables']['perfumes']['Row'] & {
		perfume_inventory: PerfumeInventory[];
	};

	let { perfume }: { perfume: Perfume } = $props();

	function deriveBestPricePerVolume(perfume: Perfume) {
		const bestPricePerVolume: { [volume: number]: PerfumeInventory } = {};
		for (const inventory of perfume.perfume_inventory) {
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
					{#if inventory.websites}
						<img
							src={inventory.websites.logo_url}
							alt={inventory.websites.name}
							class="h-10 object-contain"
						/>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>
