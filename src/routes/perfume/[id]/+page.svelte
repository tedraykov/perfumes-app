<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { Perfume } from '$lib/server/db/schema';
	import FragranceInventory from './fragrance-inventory.svelte';
	import FragranticaButton from './fragrantica-button.svelte';
	import Notes from './notes.svelte';

	let { data: perfume }: { data: Perfume } = $props();
</script>

<div class="space-y-8">
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-10">
		<div class="flex flex-col justify-center">
			<img
				src={perfume.image_url}
				alt={perfume.name}
				class="aspect-[4/3] rounded-xl bg-white object-contain shadow-xl"
			/>
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex gap-2">
				<div class="flex flex-col">
					<h1 class="text-4xl font-bold">{perfume.name}</h1>
					<p class="text-lg text-gray-500">{perfume.house}</p>
				</div>
				<div class="flex flex-1 justify-end">
					<FragranticaButton {perfume} />
				</div>
			</div>
			<div class="flex gap-2">
				<Badge class="text-sm" variant="secondary">{perfume.concentration}</Badge>
				<Badge class="text-sm" variant="secondary">{perfume.gender}</Badge>
			</div>
			<Notes {perfume} />
		</div>
	</div>
	<div class="flex flex-col items-center gap-2">
		<h2 class="text-3xl font-bold">Откъде да купиш</h2>
		<p class="text-center text-lg text-muted-foreground">
			Сравни цените между доказани търговци на парфюми
		</p>
	</div>
	<!-- <div class="rounded-lg border p-4"> -->
	<!-- 	<table class="w-full border-collapse border border-gray-300"> -->
	<!-- 		<thead> -->
	<!-- 			<tr class="bg-gray-100"> -->
	<!-- 				<th class="border p-2">Сайт</th> -->
	<!-- 				<th class="border p-2">Количество</th> -->
	<!-- 				<th class="border p-2">Цена</th> -->
	<!-- 				<th class="border p-2">Купи</th> -->
	<!-- 			</tr> -->
	<!-- 		</thead> -->
	<!-- 		<tbody> -->
	<!-- 			{#each perfume.inventory || [] as inventory} -->
	<!-- 				<tr> -->
	<!-- 					<td class="border p-2"> -->
	<!-- 						<img -->
	<!-- 							src={inventory.website?.logo} -->
	<!-- 							alt={inventory.website?.name} -->
	<!-- 							class="rounded bg-zinc-600 p-2" -->
	<!-- 						/> -->
	<!-- 					</td> -->
	<!-- 					<td> -->
	<!-- 						{inventory.volume} -->
	<!-- 					</td> -->
	<!-- 					<td class="border p-2" -->
	<!-- 						>{new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format( -->
	<!-- 							inventory.price -->
	<!-- 						)}</td -->
	<!-- 					> -->
	<!-- 					<td class="border p-2"> -->
	<!-- 						<Button href={inventory.url} target="_blank" class="text-blue-500 underline"> -->
	<!-- 							Купи -->
	<!-- 						</Button> -->
	<!-- 					</td></tr -->
	<!-- 				> -->
	<!-- 			{/each} -->
	<!-- 		</tbody> -->
	<!-- 	</table> -->
	<!-- </div> -->
	<FragranceInventory inventory={perfume.inventory} />
</div>
