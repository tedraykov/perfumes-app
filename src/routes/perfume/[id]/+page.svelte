<script>
	import { Button } from '$lib/components/ui/button';

	let { data: perfume } = $props();
</script>

<div class="container space-y-8 p-6">
	<div class="grid grid-cols-2 gap-6">
		<div class="flex flex-col">
			<div>
				<h1 class="text-4xl font-bold">{perfume.name}</h1>
				<p class="text-lg text-gray-500">{perfume.house}</p>
			</div>
			<img
				src={perfume.image_url}
				alt={perfume.name}
				class="max-h-96 rounded-lg border object-contain"
			/>
		</div>
		<div class="flex flex-col justify-center">
			<h2 class="mb-4 text-2xl font-bold">Perfume Notes</h2>
		</div>
	</div>
	<div class="rounded-lg border p-4">
		<table class="w-full border-collapse border border-gray-300">
			<thead>
				<tr class="bg-gray-100">
					<th class="border p-2">Сайт</th>
					<th class="border p-2">Количество</th>
					<th class="border p-2">Цена</th>
					<th class="border p-2">Купи</th>
				</tr>
			</thead>
			<tbody>
				{#each perfume.perfume_inventory as inventory}
					<tr>
						<td class="border p-2">
							<img
								src={inventory.websites.logo_url}
								alt={inventory.websites.name}
								class="rounded bg-zinc-600 p-2"
							/>
						</td>
						<td>
							{inventory.volume}
						</td>
						<td class="border p-2"
							>{new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(
								inventory.price
							)}</td
						>
						<td class="border p-2">
							<Button href={inventory.url} target="_blank" class="text-blue-500 underline">
								Купи
							</Button>
						</td></tr
					>
				{/each}
			</tbody>
		</table>
	</div>
</div>
