<script>
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
</script>

<h1>Scrapers:</h1>
<div class="flex flex-col gap-2">
	<form method="POST" action="?/import-elinor">
		<Button type="submit">Elinor</Button>
	</form>
	<form method="POST" action="?/link-to-fragrantica">
		<Button type="submit">Link Perfumes to Fragrantica</Button>
	</form>
	<form method="POST" action="?/import-parfiumbg">
		<Button type="submit">Parfium.bg</Button>
	</form>
	<form method="POST" action="?/import-parfiumbg-one">
		<Input name="url" required />
		<Button type="submit">Parfium.bg Single</Button>
	</form>
</div>
