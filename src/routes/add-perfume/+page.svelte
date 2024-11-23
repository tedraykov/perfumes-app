<script>
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import { Textarea } from '$lib/components/ui/textarea';

	/**
	 * @type {'manual' | 'fragrantica'}
	 */
	let inputMode = 'manual';
</script>

<div class="container flex flex-col gap-6">
	<h1 class="text-2xl font-bold">Добави парфюм</h1>
	<form method="POST" use:enhance>
		<div class="space-y-6">
			<RadioGroup value={inputMode} onValueChange={(value) => (inputMode = value)}>
				<div class="flex items-center space-x-2">
					<RadioGroupItem value="manual" id="manual" />
					<Label for="manual">Създай Ръчно</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroupItem value="fragrantica" id="fragrantica" />
					<Label for="fragrantica">Извлечи от Fragrantica</Label>
				</div>
			</RadioGroup>

			{#if inputMode === 'manual'}
				<div class="space-y-4">
					<div>
						<Label for="name">Име на парфюма</Label>
						<Input type="text" id="name" name="name" required />
					</div>
					<div>
						<Label for="house">Марка</Label>
						<Input type="text" id="house" name="house" required />
					</div>
					<div>
						<Label for="notes">Нотки</Label>
						<Textarea id="notes" name="notes" required />
					</div>
				</div>
			{:else}
				<div>
					<Label for="fragranticaLink">Линк към Fragrantica</Label>
					<Input type="url" id="fragranticaLink" name="fragranticaLink" required />
				</div>
			{/if}

			<Button type="submit">Добави парфюм</Button>
		</div>
	</form>
</div>
