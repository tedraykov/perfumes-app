<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import Pagination from './pagination.svelte';

	let { data }: PageProps = $props();

	let selectedHouses = $derived(data.selectedHouses);
	let selectedGender = $derived(data.selectedGender);
	let query = $state(data.query);
	let filterOpen = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	function handleSearch() {
		clearTimeout(timeout);
		timeout = setTimeout(applyFilters, 300);
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (query) params.set('query', query);
		if (selectedHouses?.length) params.set('houses', selectedHouses.join(','));
		if (selectedGender?.length) params.set('gender', selectedGender.join(','));
		goto(`?${params.toString()}`, { keepFocus: true, invalidateAll: true });
	}

	function toggleHouse(house: string) {
		const next = selectedHouses.includes(house)
			? selectedHouses.filter((h) => h !== house)
			: [...selectedHouses, house];
		const params = new URLSearchParams();
		if (query) params.set('query', query);
		if (next.length) params.set('houses', next.join(','));
		if (selectedGender?.length) params.set('gender', selectedGender.join(','));
		goto(`?${params.toString()}`, { invalidateAll: true });
	}

	function toggleGender(gender: string) {
		const next = selectedGender.includes(gender)
			? selectedGender.filter((g) => g !== gender)
			: [...selectedGender, gender];
		const params = new URLSearchParams();
		if (query) params.set('query', query);
		if (selectedHouses?.length) params.set('houses', selectedHouses.join(','));
		if (next.length) params.set('gender', next.join(','));
		goto(`?${params.toString()}`, { invalidateAll: true });
	}

	function clearAll() {
		query = '';
		goto('/perfumes', { invalidateAll: true });
	}

	function bestPrice(perfume: (typeof data.perfumes)[0]) {
		if (!perfume.inventory?.length) return null;
		return Math.min(...perfume.inventory.map((i) => i.price));
	}

	const genders = ['women', 'men', 'unisex'];
	const hasFilters = $derived(
		(selectedHouses?.length ?? 0) > 0 || (selectedGender?.length ?? 0) > 0 || !!query
	);
</script>

<div class="page">
	<!-- Hero -->
	<section class="hero">
		<div class="hero-left">
			<span class="label">КАТАЛОГ</span>
			<h1 class="hero-title">
				Намери парфюма.<br />
				<em>Сравни цените.</em>
			</h1>
			<p class="hero-desc">
				Търси сред всички парфюми и виж цените от различни търговци на едно място.
			</p>
		</div>
		<div class="hero-stats">
			<div class="stat">
				<span class="stat-value">{data.total}</span>
				<span class="stat-label">ПАРФЮМИ</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.houses?.length ?? 0}</span>
				<span class="stat-label">МАРКИ</span>
			</div>
		</div>
	</section>

	<!-- Mobile filter toolbar -->
	<div class="mobile-toolbar">
		<button class="filter-btn" onclick={() => (filterOpen = true)}>
			<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2">
				<line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
				<circle cx="6" cy="4" r="1.6" fill="currentColor" /><circle cx="11" cy="8" r="1.6" fill="currentColor" /><circle cx="5" cy="12" r="1.6" fill="currentColor" />
			</svg>
			ФИЛТРИ
		</button>
		<span class="count-label">{String(data.total).padStart(3, '0')} ПАРФЮМА</span>
	</div>

	<!-- Main grid area -->
	<section class="main-section">
		<!-- Desktop sidebar -->
		<aside class="sidebar">
			<div class="search-group">
				<div class="filter-group-head">ТЪРСЕНЕ</div>
				<input
					class="search-input"
					type="text"
					placeholder="Търси парфюм..."
					bind:value={query}
					oninput={handleSearch}
				/>
			</div>

			<div class="filter-group">
				<div class="filter-group-head">МАРКА</div>
				<div class="radio-list">
					{#each data.houses ?? [] as house}
						<button
							class="radio-btn"
							class:active={selectedHouses.includes(house)}
							onclick={() => toggleHouse(house)}
						>
							<span class="radio-indicator" class:checked={selectedHouses.includes(house)}></span>
							<span class="radio-label">{house}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<div class="filter-group-head">ПОЛ</div>
				<div class="radio-list">
					{#each genders as gender}
						<button
							class="radio-btn"
							class:active={selectedGender.includes(gender)}
							onclick={() => toggleGender(gender)}
						>
							<span class="radio-indicator" class:checked={selectedGender.includes(gender)}></span>
							<span class="radio-label">{gender}</span>
						</button>
					{/each}
				</div>
			</div>

			{#if hasFilters}
				<button class="reset-btn" onclick={clearAll}>Изчисти всички</button>
			{/if}
		</aside>

		<!-- Product grid -->
		<div class="grid-area">
			<div class="grid-header">
				<span class="label">
					{String(data.total).padStart(3, '0')} ПАРФЮМА
					{#if selectedHouses?.length}· {selectedHouses.join(', ').toUpperCase()}{/if}
					{#if selectedGender?.length}· {selectedGender.join(', ').toUpperCase()}{/if}
				</span>
			</div>

			<div class="product-grid">
				{#each data.perfumes ?? [] as perfume (perfume.id)}
					{@const price = bestPrice(perfume)}
					<a href="/perfume/{perfume.id}" class="product-card">
						<div class="card-image-wrap">
							{#if perfume.image_url}
								<img src={perfume.image_url} alt={perfume.name} class="card-image" />
							{:else}
								<div class="card-image-placeholder">
									<span class="placeholder-initial">{perfume.name[0]}</span>
								</div>
							{/if}
							<span class="card-gender">{perfume.gender}</span>
							<span class="card-open">ОТВОРИ ↗</span>
						</div>
						<div class="card-info">
							<div class="card-info-row">
								<span class="card-house">{perfume.house}</span>
								<span class="card-conc">{perfume.concentration}</span>
							</div>
							<span class="card-name">{perfume.name}</span>
							{#if price !== null}
								<div class="card-price-row">
									<span class="card-price-from">ОТ </span>
									<span class="card-price">{new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(price)}</span>
								</div>
							{/if}
						</div>
					</a>
				{/each}

				{#if !data.perfumes?.length}
					<div class="empty-state">
						<span class="empty-title">Нищо тук, тихо.</span>
						<span class="label">ОПИТАЙТЕ С ДРУГ ФИЛТЪР</span>
					</div>
				{/if}
			</div>

			<Pagination />
		</div>
	</section>
</div>

<!-- Mobile filter drawer -->
{#if filterOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="drawer-overlay" onclick={() => (filterOpen = false)}></div>
	<div class="filter-drawer">
		<div class="drawer-top">
			<span class="label" style="font-size:11.5px;letter-spacing:0.18em">ФИЛТРИ</span>
			<button class="close-btn" onclick={() => (filterOpen = false)}>×</button>
		</div>

		<div class="search-group">
			<div class="filter-group-head">ТЪРСЕНЕ</div>
			<input
				class="search-input"
				type="text"
				placeholder="Търси парфюм..."
				bind:value={query}
				oninput={handleSearch}
			/>
		</div>

		<div class="filter-group">
			<div class="filter-group-head">МАРКА</div>
			<div class="radio-list">
				{#each data.houses ?? [] as house}
					<button class="radio-btn" class:active={selectedHouses.includes(house)} onclick={() => { toggleHouse(house); }}>
						<span class="radio-indicator" class:checked={selectedHouses.includes(house)}></span>
						<span class="radio-label">{house}</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="filter-group">
			<div class="filter-group-head">ПОЛ</div>
			<div class="radio-list">
				{#each genders as gender}
					<button class="radio-btn" class:active={selectedGender.includes(gender)} onclick={() => { toggleGender(gender); }}>
						<span class="radio-indicator" class:checked={selectedGender.includes(gender)}></span>
						<span class="radio-label">{gender}</span>
					</button>
				{/each}
			</div>
		</div>

		{#if hasFilters}
			<button class="reset-btn" onclick={() => { clearAll(); filterOpen = false; }}>Изчисти всички</button>
		{/if}

		<button class="apply-btn" onclick={() => (filterOpen = false)}>
			ПОКАЖИ {String(data.total).padStart(3, '0')} ПАРФЮМА
		</button>
	</div>
{/if}

<style>
	.page {
		min-height: 100vh;
		background: var(--cream);
		color: var(--ink);
	}

	/* Hero */
	.hero {
		padding: 56px 56px 40px;
		border-bottom: 1px solid var(--line);
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 56px;
		align-items: end;
	}

	.hero-title {
		font-family: 'Cormorant Garamond', serif;
		font-weight: 600;
		font-size: 60px;
		line-height: 1;
		margin: 18px 0 14px;
		letter-spacing: -0.02em;
	}

	.hero-title em {
		font-style: italic;
		color: var(--amber);
		font-weight: 500;
	}

	.hero-desc {
		font-family: 'Manrope', sans-serif;
		font-size: 15px;
		line-height: 1.6;
		color: var(--mute);
		max-width: 520px;
		margin: 0;
	}

	.hero-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
		padding-bottom: 6px;
	}

	.stat {
		border-top: 1px solid var(--ink);
		padding-top: 12px;
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-family: 'Cormorant Garamond', serif;
		font-size: 44px;
		font-weight: 600;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		display: block;
		margin-top: 8px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.16em;
		color: var(--mute);
	}

	/* Labels */
	.label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--mute);
		text-transform: uppercase;
	}

	/* Mobile toolbar */
	.mobile-toolbar {
		display: none;
		justify-content: space-between;
		align-items: center;
		padding: 14px 20px;
		border-bottom: 1px solid var(--line);
		position: sticky;
		top: 57px;
		background: var(--cream);
		z-index: 8;
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: 1px solid var(--ink);
		padding: 10px 14px;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		color: var(--ink);
	}

	.count-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.14em;
		color: var(--mute);
	}

	/* Main section */
	.main-section {
		display: grid;
		grid-template-columns: 300px 1fr;
		align-items: flex-start;
	}

	/* Sidebar */
	.sidebar {
		padding: 40px 32px 60px 56px;
		border-right: 1px solid var(--line);
		min-height: 60vh;
		position: sticky;
		top: 70px;
		max-height: calc(100vh - 70px);
		overflow-y: auto;
	}

	.search-group {
		margin-bottom: 28px;
	}

	.search-input {
		width: 100%;
		margin-top: 10px;
		padding: 10px 12px;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		font-family: 'Manrope', sans-serif;
		font-size: 14px;
		outline: none;
		transition: border-color 0.15s;
	}

	.search-input:focus {
		border-color: var(--ink);
	}

	.filter-group {
		margin-bottom: 28px;
	}

	.filter-group-head {
		border-top: 1px solid var(--ink);
		padding-top: 10px;
		margin-bottom: 14px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.18em;
		color: var(--ink);
	}

	.radio-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.radio-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 2px 0;
		background: transparent;
		border: 0;
		cursor: pointer;
		text-align: left;
	}

	.radio-indicator {
		width: 8px;
		height: 8px;
		border: 1px solid var(--ink);
		flex-shrink: 0;
		background: transparent;
		transition: background 0.15s;
	}

	.radio-indicator.checked {
		background: var(--ink);
	}

	.radio-label {
		font-family: 'Manrope', sans-serif;
		font-size: 14px;
		color: var(--mute);
		transition: color 0.15s;
	}

	.radio-btn.active .radio-label {
		color: var(--ink);
		font-weight: 500;
	}

	.reset-btn {
		margin-top: 24px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--mute);
		background: transparent;
		border: 0;
		padding: 0;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	/* Grid area */
	.grid-area {
		padding: 40px 56px 80px;
	}

	.grid-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 32px;
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-top: 1px solid var(--line);
		border-left: 1px solid var(--line);
	}

	/* Product card */
	.product-card {
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		cursor: pointer;
		text-decoration: none;
		color: inherit;
		display: block;
		background: var(--cream);
		transition: background 200ms ease;
	}

	.product-card:hover {
		background: var(--paper);
	}

	.card-image-wrap {
		position: relative;
		aspect-ratio: 1 / 1.15;
		overflow: hidden;
		background: var(--paper);
		background-image: repeating-linear-gradient(
			90deg,
			rgba(26, 22, 18, 0.025) 0 1px,
			transparent 1px 6px
		);
	}

	.card-image {
		position: absolute;
		inset: 8% 15%;
		width: 70%;
		height: 84%;
		object-fit: contain;
		display: block;
	}

	.card-image-placeholder {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-initial {
		font-family: 'Cormorant Garamond', serif;
		font-size: 80px;
		font-style: italic;
		color: var(--line);
		font-weight: 600;
	}

	.card-gender {
		position: absolute;
		top: 14px;
		right: 16px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.16em;
		color: var(--mute);
		text-transform: uppercase;
	}

	.card-open {
		position: absolute;
		bottom: 16px;
		left: 16px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.16em;
		color: var(--ink);
		border-bottom: 1px solid var(--ink);
		padding-bottom: 2px;
		opacity: 0;
		transform: translateY(6px);
		transition: all 200ms ease;
	}

	.product-card:hover .card-open {
		opacity: 1;
		transform: translateY(0);
	}

	.card-info {
		border-top: 1px solid var(--line);
		padding: 18px 20px 20px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.card-info-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
	}

	.card-house {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.16em;
		color: var(--mute);
		text-transform: uppercase;
	}

	.card-conc {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.10em;
		color: var(--mute);
	}

	.card-name {
		font-family: 'Cormorant Garamond', serif;
		font-size: 26px;
		line-height: 1.05;
		font-style: italic;
		letter-spacing: -0.01em;
		font-weight: 500;
	}

	.card-price-row {
		margin-top: 6px;
		display: flex;
		align-items: baseline;
	}

	.card-price-from {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.14em;
		color: var(--mute);
	}

	.card-price {
		font-family: 'Cormorant Garamond', serif;
		font-size: 22px;
		font-variant-numeric: tabular-nums;
	}

	/* Empty state */
	.empty-state {
		grid-column: 1 / -1;
		border-right: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		padding: 80px;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
	}

	.empty-title {
		font-family: 'Cormorant Garamond', serif;
		font-size: 40px;
		font-style: italic;
		color: var(--mute);
	}

	/* Mobile drawer */
	.drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(26, 22, 18, 0.4);
		backdrop-filter: blur(2px);
		z-index: 100;
	}

	.filter-drawer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--cream);
		max-height: 88vh;
		overflow-y: auto;
		border-top: 1px solid var(--ink);
		padding: 22px 22px 28px;
		z-index: 101;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.drawer-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.close-btn {
		background: transparent;
		border: 0;
		font-size: 22px;
		cursor: pointer;
		color: var(--ink);
		padding: 0;
		line-height: 1;
	}

	.apply-btn {
		width: 100%;
		margin-top: 24px;
		padding: 16px 0;
		background: var(--ink);
		color: var(--cream);
		border: 0;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		letter-spacing: 0.18em;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.product-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.hero {
			padding: 32px 20px 28px;
			grid-template-columns: 1fr;
			gap: 28px;
		}

		.hero-title {
			font-size: 36px;
		}

		.hero-stats {
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}

		.mobile-toolbar {
			display: flex;
		}

		.main-section {
			grid-template-columns: 1fr;
		}

		.sidebar {
			display: none;
		}

		.grid-area {
			padding: 20px 20px 60px;
		}

		.grid-header {
			display: none;
		}

		.product-grid {
			grid-template-columns: 1fr;
		}

		.card-name {
			font-size: 22px;
		}
	}
</style>
