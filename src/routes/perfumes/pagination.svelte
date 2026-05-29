<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const perPage = 20;
	const count = $derived(page.data.total);
	const currentPage = $derived(page.data.page ?? 1);
	const totalPages = $derived(Math.ceil(count / perPage));

	function goTo(p: number) {
		const url = new URL(location.href);
		url.searchParams.set('page', String(p));
		goto(url.toString());
	}

	const pages = $derived(() => {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
		const near = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1].filter(p => p >= 1 && p <= totalPages));
		return [...near].sort((a, b) => a - b);
	});
</script>

{#if totalPages > 1}
	<nav class="pagination">
		<button class="page-btn" disabled={currentPage <= 1} onclick={() => goTo(currentPage - 1)}>
			← НАЗАД
		</button>

		{#each pages() as p, i}
			{@const prev = pages()[i - 1]}
			{#if prev && p - prev > 1}
				<span class="ellipsis">…</span>
			{/if}
			<button
				class="page-btn"
				class:active={p === currentPage}
				onclick={() => goTo(p)}
			>{p}</button>
		{/each}

		<button class="page-btn" disabled={currentPage >= totalPages} onclick={() => goTo(currentPage + 1)}>
			НАПРЕД →
		</button>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 48px;
		padding-top: 24px;
		border-top: 1px solid var(--line);
	}

	.page-btn {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.12em;
		color: var(--mute);
		background: transparent;
		border: 1px solid transparent;
		padding: 8px 14px;
		cursor: pointer;
		transition: all 150ms;
	}

	.page-btn:hover:not(:disabled) {
		color: var(--ink);
		border-color: var(--ink);
	}

	.page-btn.active {
		color: var(--cream);
		background: var(--ink);
		border-color: var(--ink);
	}

	.page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.ellipsis {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--mute);
		padding: 0 4px;
	}
</style>
