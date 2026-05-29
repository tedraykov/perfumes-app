<script lang="ts">
	import type { Perfume } from '$lib/server/db/schema';
	import { toMoney } from '$lib/utils';

	let { perfume }: { perfume: Perfume } = $props();

	function bestPricePerVolume(perfume: Perfume) {
		const best: Record<number, (typeof perfume.inventory)[0]> = {};
		for (const inv of perfume.inventory ?? []) {
			if (!inv.volume || !inv.price) continue;
			if (!best[inv.volume] || (best[inv.volume].price ?? Infinity) > inv.price) {
				best[inv.volume] = inv;
			}
		}
		return Object.values(best);
	}
</script>

<ul class="price-list">
	{#each bestPricePerVolume(perfume) as inv}
		<li class="price-item">
			<span class="volume">{inv.volume} мл</span>
			<span class="from">от</span>
			<strong class="price">{toMoney(inv.price)}</strong>
		</li>
	{/each}
</ul>

<style>
	.price-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.price-item {
		display: flex;
		align-items: baseline;
		gap: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--mute);
	}

	.price {
		font-family: 'Cormorant Garamond', serif;
		font-size: 18px;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		font-weight: normal;
	}
</style>
