<script lang="ts">
	import { Checkbox } from './ui/checkbox';
	import { Label } from './ui/label';
	import { Input } from './ui/input';

	interface Props {
		attributes: string[];
		selectedAttributes?: string[];
		onchange: (selectedAttributes: string[]) => void;
		filterLabel: string;
		withSearch?: boolean;
		searchPlaceholder?: string;
	}

	let {
		attributes,
		selectedAttributes = $bindable([]),
		filterLabel,
		onchange,
		withSearch = false,
		searchPlaceholder
	}: Props = $props();

	let searchQuery = $state('');

	let filteredAttributes = $derived(
		attributes
			.filter(
				(attribute) =>
					(searchQuery === '' || attribute.toLowerCase().includes(searchQuery.toLowerCase())) &&
					attribute !== ''
			)
			.sort()
	);

	function toggleAttribute(attribute: string) {
		if (selectedAttributes.includes(attribute)) {
			selectedAttributes = selectedAttributes.filter((h) => h !== attribute);
		} else {
			selectedAttributes = [...selectedAttributes, attribute];
		}
		onchange(selectedAttributes);
	}
</script>

<div>
	<h2 class="mb-2 text-lg font-semibold">{filterLabel}</h2>
	<div class="flex flex-col items-start gap-2">
		{#if withSearch}
			<Input type="text" placeholder={searchPlaceholder || 'Търси...'} bind:value={searchQuery} />
		{/if}
		<div class="max-h-80 w-full space-y-2 overflow-y-auto">
			{#each filteredAttributes as attribute}
				<div class="flex items-center space-x-2">
					<Checkbox
						id={attribute}
						checked={selectedAttributes.includes(attribute)}
						onCheckedChange={() => toggleAttribute(attribute)}
					/>
					<Label for={attribute}>{attribute}</Label>
				</div>
			{/each}
		</div>
	</div>
</div>
