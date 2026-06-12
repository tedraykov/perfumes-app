<script lang="ts">
	import type { Perfume } from '$lib/server/db/schema';

	let { inventory }: { inventory: Perfume['inventory'] } = $props();

	const sorted = $derived(
		[...(inventory ?? [])].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
	);

	const minPrice = $derived(
		inventory?.length ? Math.min(...inventory.map((i) => i.price ?? Infinity)) : null
	);

	function formatPrice(price: number | null | undefined) {
		if (price == null) return '—';
		return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(price);
	}

	function perMl(price: number | null | undefined, volume: number | null | undefined) {
		if (price == null || !volume) return null;
		return `${new Intl.NumberFormat('bg-BG', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(price / volume)} €/МЛ`;
	}

	function sellerInitials(name: string) {
		return name
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('');
	}
</script>

{#if !sorted.length}
	<p class="empty">Не бяха намерени търговци, които предлагат този аромат.</p>
{:else}
	<div class="table">
		<!-- Header -->
		<div class="table-head">
			<span class="th">#</span>
			<span class="th">ТЪРГОВЕЦ</span>
			<span class="th">КОЛ.</span>
			<span class="th right">ЦЕНА</span>
			<span class="th"></span>
		</div>

		{#each sorted as item, i}
			{@const isBest = item.price === minPrice}
			{@const unitPrice = perMl(item.price, item.volume)}
			<div class="table-row" class:best={isBest}>
				<span class="td-idx">{String(i + 1).padStart(2, '0')}</span>

				<div class="td-seller">
					<div class="seller-logo">
						{#if item.website?.logo}
							<img src={item.website.logo} alt={item.website.name} class="logo-img" />
						{:else}
							<span class="logo-initials">{sellerInitials(item.website?.name ?? '?')}</span>
						{/if}
					</div>
					<div class="seller-info">
						<div class="seller-name-row">
							<span class="seller-name">{item.website?.name ?? 'Неизвестен'}</span>
							{#if isBest}
								<span class="best-badge">НАЙ-НИСКА ЦЕНА</span>
							{/if}
						</div>
						{#if item.is_tester}
							<span class="tester-tag">ТЕСТЕР</span>
						{/if}
					</div>
				</div>

				<div class="td-volume">
					<span class="volume">{item.volume} мл</span>
				</div>

				<div class="td-price">
					<span class="price">{formatPrice(item.price)}</span>
					<span class="price-sub">{unitPrice ? `${unitPrice} · ` : ''}С ДДС</span>
				</div>

				<div class="td-action">
					{#if item.url}
						<a href={item.url} target="_blank" rel="noopener noreferrer" class="visit-btn">
							ВИЖ МАГАЗИНА ↗
						</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.empty {
		text-align: center;
		color: var(--mute);
		font-family: 'Manrope', sans-serif;
		font-size: 15px;
		padding: 40px 0;
	}

	.table {
		border-top: 1px solid var(--ink);
		max-width: 900px;
		margin: 0 auto;
	}

	.table-head {
		display: grid;
		grid-template-columns: 0.3fr 3fr 1fr 1.2fr 1.4fr;
		padding: 14px 16px;
		border-bottom: 1px solid var(--line);
	}

	.th {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.18em;
		color: var(--mute);
	}

	.th.right {
		text-align: right;
	}

	.table-row {
		display: grid;
		grid-template-columns: 0.3fr 3fr 1fr 1.2fr 1.4fr;
		padding: 22px 16px;
		align-items: center;
		border-bottom: 1px solid var(--line);
		background: transparent;
		transition: background 150ms ease;
	}

	.table-row:hover {
		background: var(--paper);
		background-image: repeating-linear-gradient(
			90deg,
			rgba(26, 22, 18, 0.025) 0 1px,
			transparent 1px 6px
		);
	}

	.table-row.best {
		box-shadow: inset 3px 0 0 var(--amber);
		background: var(--paper);
	}

	.td-idx {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--mute);
	}

	.td-seller {
		display: flex;
		align-items: center;
		gap: 18px;
	}

	.seller-logo {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: var(--paper);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.logo-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		padding: 8px;
	}

	.logo-initials {
		font-family: 'Cormorant Garamond', serif;
		font-style: italic;
		font-size: 22px;
		color: var(--ink);
	}

	.seller-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.seller-name-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.seller-name {
		font-family: 'Cormorant Garamond', serif;
		font-size: 22px;
		font-style: italic;
		line-height: 1;
		font-weight: 500;
	}

	.best-badge {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.16em;
		color: var(--cream);
		background: var(--amber);
		padding: 3px 6px;
		flex-shrink: 0;
	}

	.tester-tag {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.14em;
		color: var(--mute);
	}

	.td-volume {
		display: flex;
		flex-direction: column;
	}

	.volume {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		letter-spacing: 0.08em;
		color: var(--ink);
	}

	.td-price {
		display: flex;
		flex-direction: column;
	}

	.price {
		font-family: 'Cormorant Garamond', serif;
		font-size: 28px;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.price-sub {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9.5px;
		color: var(--mute);
		margin-top: 4px;
		letter-spacing: 0.08em;
	}

	.td-action {
		display: flex;
		justify-content: flex-end;
	}

	.visit-btn {
		padding: 14px 22px;
		border: 1px solid var(--ink);
		color: var(--ink);
		background: transparent;
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.16em;
		transition: all 150ms;
		display: inline-block;
	}

	.visit-btn:hover {
		background: var(--ink);
		color: var(--cream);
	}

	@media (max-width: 768px) {
		.table {
			max-width: 100%;
		}

		.table-head {
			display: none;
		}

		.table-row {
			grid-template-columns: 1fr;
			gap: 12px;
			padding: 20px 0;
		}

		.table-row.best {
			padding-left: 14px;
		}

		.td-idx {
			display: none;
		}

		.td-action {
			justify-content: flex-start;
		}
	}
</style>
