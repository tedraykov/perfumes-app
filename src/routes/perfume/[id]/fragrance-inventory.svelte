<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { Perfume } from '$lib/server/db/schema';
	import ExternalIcon from '@lucide/svelte/icons/square-arrow-out-up-right';

	let { inventory }: { inventory: Perfume['inventory'] } = $props();
</script>

{#if !inventory || inventory?.length === 0}
	<p class="text-center text-muted-foreground opacity-50">
		Не бяха намерени търговци, които предлагат този аромат
	</p>
{:else}
	<div class="mx-auto flex max-w-screen-md flex-col gap-4">
		{#each inventory as item}
			<Card>
				<CardContent class="flex items-center justify-between">
					<div class="flex flex-col items-center">
						<img
							src={item.website?.logo}
							alt={`${item.website?.name} logo`}
							class="h-12 object-contain"
						/>
					</div>
					<div class="flex flex-col sm:flex-row sm:gap-4">
						<div class="flex flex-col">
							<span class="text-xl font-semibold leading-tight">{item.price} лв.</span>
							<span class="text-sm text-muted-foreground">{item.volume}мл</span>
						</div>
						<Button variant="secondary" href={item.url}>Виж офертата <ExternalIcon /></Button>
					</div>
					<!-- <Button variant="secondary" href={item.url}>Виж офертата <ExternalIcon /></Button> -->
				</CardContent>
			</Card>
		{/each}
	</div>
{/if}
