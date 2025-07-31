<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import PenLineIcon from '@lucide/svelte/icons/pen-line';
	import CrossIcon from '@lucide/svelte/icons/x';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ExternalIcon from '@lucide/svelte/icons/square-arrow-out-up-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { Input } from '$lib/components/ui/input';
	import type { Perfume } from '$lib/server/db/schema';

	let { perfume }: { perfume: Perfume } = $props();
	let fragranticaUrl = $state(perfume.fragrantica_url);
	let editMode = $state(false);
</script>

<div class="flex h-fit items-end gap-2">
	<Popover.Popover>
		<Popover.Trigger class={`${buttonVariants({ variant: 'outline' })} min-w-max sm:py-6`}>
			<img src="/fragrantica.svg" alt="Fragrantica Logo" class="size-6 object-cover sm:size-8" />
			<ChevronDownIcon />
		</Popover.Trigger>
		<Popover.Content align="end" class="flex w-96 items-center gap-2">
			{#if editMode}
				<form class="flex w-full gap-2" method="POST" action="?/link-fragrantica">
					<Input bind:value={fragranticaUrl} name="fragranticaLink" required />
					<input type="text" value={perfume.id} name="perfumeId" hidden aria-hidden="true" />
					<Button
						disabled={fragranticaUrl === perfume.fragrantica_url}
						variant="default"
						size="icon"
						type="submit"
					>
						<CheckIcon />
					</Button>
					<Button variant="secondary" size="icon" onclick={() => (editMode = false)}>
						<CrossIcon />
					</Button>
				</form>
			{:else}
				{#if perfume.fragrantica_url}
					<Button
						variant="secondary"
						class="flex min-w-0 flex-1"
						href={perfume.fragrantica_url}
						target="_blank"
					>
						<span class="max-w-fit overflow-hidden overflow-ellipsis">
							{perfume.fragrantica_name}
						</span>
						<ExternalIcon />
					</Button>
				{:else}
					<p class="flex-1">Няма Fragrantica линк</p>
				{/if}
				<Button onclick={() => (editMode = true)}>
					<PenLineIcon />
				</Button>
			{/if}
		</Popover.Content>
	</Popover.Popover>
</div>
