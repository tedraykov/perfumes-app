<script lang="ts">
	import { CardTitle } from '$lib/components/ui/card';
	import type { Perfume } from '$lib/server/db/schema';

	let { notes, title }: { notes: Perfume['notes']; title: string } = $props();
</script>

{#if notes}
	<div>
		<CardTitle class="text-center">{title}</CardTitle>
		<div class="m-1 flex flex-wrap items-end justify-center">
			{#each notes as note}
				<div class="m-2 flex flex-col items-center text-center">
					<img src={note.note.image_url} alt={note.note.name} class="w-12 rounded object-contain" />
					<span class="mt-1 text-sm">{note.note.name}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
