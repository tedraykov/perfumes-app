<script lang="ts">
	import type { Perfume } from '$lib/server/db/schema';

	let { perfume }: { perfume: Perfume } = $props();
	let editMode = $state(false);
	let fragranticaUrl = $state(perfume.fragrantica_url ?? '');
</script>

<div class="frag-wrap">
	{#if editMode}
		<form class="frag-form" method="POST" action="?/link-fragrantica">
			<input
				class="frag-input"
				type="text"
				bind:value={fragranticaUrl}
				name="fragranticaLink"
				placeholder="URL от Fragrantica..."
				required
			/>
			<input type="hidden" value={perfume.id} name="perfumeId" />
			<button class="frag-btn primary" type="submit">✓</button>
			<button class="frag-btn" type="button" onclick={() => (editMode = false)}>×</button>
		</form>
	{:else}
		<div class="frag-row">
			{#if perfume.fragrantica_url}
				<a href={perfume.fragrantica_url} target="_blank" rel="noopener noreferrer" class="frag-link">
					<img src="/fragrantica.svg" alt="Fragrantica" class="frag-logo" />
					<span>{perfume.fragrantica_name ?? 'Fragrantica'}</span>
					<span class="arrow">↗</span>
				</a>
			{:else}
				<span class="no-link">Няма Fragrantica линк</span>
			{/if}
			<button class="edit-btn" onclick={() => (editMode = true)}>Редактирай</button>
		</div>
	{/if}
</div>

<style>
	.frag-wrap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.frag-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.frag-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--ink);
		text-decoration: none;
		border-bottom: 1px solid var(--line);
		padding-bottom: 2px;
	}

	.frag-link:hover {
		border-bottom-color: var(--ink);
	}

	.frag-logo {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}

	.arrow {
		font-size: 12px;
	}

	.no-link {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--mute);
		letter-spacing: 0.10em;
	}

	.edit-btn {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--mute);
		background: transparent;
		border: 0;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.frag-form {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.frag-input {
		flex: 1;
		padding: 8px 10px;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		font-family: 'Manrope', sans-serif;
		font-size: 13px;
		outline: none;
		min-width: 0;
	}

	.frag-input:focus {
		border-color: var(--ink);
	}

	.frag-btn {
		padding: 8px 14px;
		border: 1px solid var(--ink);
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		transition: all 150ms;
		flex-shrink: 0;
	}

	.frag-btn.primary {
		background: var(--ink);
		color: var(--cream);
	}

	.frag-btn:hover:not(.primary) {
		background: var(--paper);
	}
</style>
