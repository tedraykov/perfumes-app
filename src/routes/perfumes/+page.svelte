<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { genderLabel } from '$lib';
	import Pagination from './pagination.svelte';

	let { data }: PageProps = $props();

	let selectedHouses = $derived(data.selectedHouses);
	let selectedGender = $derived(data.selectedGender);
	let sort = $derived(data.sort ?? 'name');
	let query = $state(data.query);
	let houseQuery = $state('');
	let filterOpen = $state(false);
	let timeout: ReturnType<typeof setTimeout>;

	const SORT_LABELS: Record<string, string> = {
		name: 'Име (А–Я)',
		'price-asc': 'Цена (ниска → висока)',
		'price-desc': 'Цена (висока → ниска)'
	};

	function buildParams(over: {
		query?: string;
		houses?: string[];
		genders?: string[];
		sort?: string;
	} = {}) {
		const params = new URLSearchParams();
		const q = over.query ?? query;
		const houses = over.houses ?? selectedHouses;
		const genders = over.genders ?? selectedGender;
		const s = over.sort ?? sort;
		if (q) params.set('query', q);
		if (houses?.length) params.set('houses', houses.join(','));
		if (genders?.length) params.set('gender', genders.join(','));
		if (s && s !== 'name') params.set('sort', s);
		return params;
	}

	function navigate(over: Parameters<typeof buildParams>[0] = {}) {
		goto(`?${buildParams(over).toString()}`, {
			keepFocus: true,
			noScroll: true,
			invalidateAll: true
		});
	}

	function handleSearch() {
		clearTimeout(timeout);
		timeout = setTimeout(() => navigate(), 300);
	}

	function clearSearch() {
		query = '';
		navigate();
	}

	function toggleHouse(house: string) {
		const next = selectedHouses.includes(house)
			? selectedHouses.filter((h) => h !== house)
			: [...selectedHouses, house];
		navigate({ houses: next });
	}

	function toggleGender(gender: string) {
		const next = selectedGender.includes(gender)
			? selectedGender.filter((g) => g !== gender)
			: [...selectedGender, gender];
		navigate({ genders: next });
	}

	function setSort(value: string) {
		navigate({ sort: value });
	}

	function clearAll() {
		query = '';
		houseQuery = '';
		goto('/perfumes', { invalidateAll: true, noScroll: true });
	}

	function bestPrice(perfume: (typeof data.perfumes)[0]) {
		if (!perfume.inventory?.length) return null;
		return Math.min(...perfume.inventory.map((i) => i.price));
	}

	function offerCount(perfume: (typeof data.perfumes)[0]) {
		return perfume.inventory?.length ?? 0;
	}

	const genders = ['women', 'men', 'unisex'];
	const hasFilters = $derived(
		(selectedHouses?.length ?? 0) > 0 || (selectedGender?.length ?? 0) > 0 || !!query
	);
	const visibleHouses = $derived(
		(data.houses ?? []).filter((h) => h.toLowerCase().includes(houseQuery.trim().toLowerCase()))
	);
	const formatPrice = (value: number) =>
		new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(value);
</script>

<svelte:head>
	<title>Каталог · парфюмни ентусиасти</title>
	<meta
		name="description"
		content="Търси сред всички парфюми и сравни цените от български търговци на едно място."
	/>
</svelte:head>

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
			{#if hasFilters}
				<span class="filter-count">{(selectedHouses?.length ?? 0) + (selectedGender?.length ?? 0) + (query ? 1 : 0)}</span>
			{/if}
		</button>
		<label class="sort-control mobile-sort">
			<span class="sort-label">ПОДРЕДИ</span>
			<select class="sort-select" value={sort} onchange={(e) => setSort(e.currentTarget.value)}>
				{#each Object.entries(SORT_LABELS) as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</label>
	</div>

	<!-- Main grid area -->
	<section class="main-section">
		<!-- Desktop sidebar -->
		<aside class="sidebar">
			<div class="search-group">
				<div class="filter-group-head">ТЪРСЕНЕ</div>
				<div class="search-wrap">
					<input
						class="search-input"
						type="search"
						placeholder="Търси парфюм..."
						bind:value={query}
						oninput={handleSearch}
					/>
					{#if query}
						<button class="search-clear" onclick={clearSearch} aria-label="Изчисти търсенето">×</button>
					{/if}
				</div>
			</div>

			<div class="filter-group">
				<div class="filter-group-head">МАРКА</div>
				{#if (data.houses?.length ?? 0) > 8}
					<input
						class="search-input house-search"
						type="search"
						placeholder="Намери марка..."
						bind:value={houseQuery}
					/>
				{/if}
				<div class="radio-list">
					{#each visibleHouses as house}
						<button
							class="radio-btn"
							class:active={selectedHouses.includes(house)}
							onclick={() => toggleHouse(house)}
						>
							<span class="radio-indicator" class:checked={selectedHouses.includes(house)}></span>
							<span class="radio-label">{house}</span>
						</button>
					{/each}
					{#if !visibleHouses.length}
						<span class="no-houses">Няма съвпадения</span>
					{/if}
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
							<span class="radio-label">{genderLabel(gender)}</span>
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
				<span class="label">{String(data.total).padStart(3, '0')} ПАРФЮМА</span>
				<label class="sort-control">
					<span class="sort-label">ПОДРЕДИ</span>
					<select class="sort-select" value={sort} onchange={(e) => setSort(e.currentTarget.value)}>
						{#each Object.entries(SORT_LABELS) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
				</label>
			</div>

			{#if hasFilters}
				<div class="applied-filters">
					{#if query}
						<button class="chip" onclick={clearSearch}>
							„{query}“ <span class="chip-x">×</span>
						</button>
					{/if}
					{#each selectedHouses as house}
						<button class="chip" onclick={() => toggleHouse(house)}>
							{house} <span class="chip-x">×</span>
						</button>
					{/each}
					{#each selectedGender as gender}
						<button class="chip" onclick={() => toggleGender(gender)}>
							{genderLabel(gender)} <span class="chip-x">×</span>
						</button>
					{/each}
					<button class="chip chip-clear" onclick={clearAll}>ИЗЧИСТИ ВСИЧКИ</button>
				</div>
			{/if}

			<div class="product-grid">
				{#each data.perfumes ?? [] as perfume (perfume.id)}
					{@const price = bestPrice(perfume)}
					{@const offers = offerCount(perfume)}
					<a href="/perfume/{perfume.id}" class="product-card">
						<div class="card-image-wrap">
							{#if perfume.image_url}
								<img
									src={perfume.image_url}
									alt="{perfume.house} {perfume.name}"
									class="card-image"
									loading="lazy"
									decoding="async"
								/>
							{:else}
								<div class="card-image-placeholder">
									<span class="placeholder-initial">{perfume.name[0]}</span>
								</div>
							{/if}
							<span class="card-gender">{genderLabel(perfume.gender)}</span>
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
									<span class="card-price-from">ОТ&nbsp;</span>
									<span class="card-price">{formatPrice(price)}</span>
									{#if offers > 1}
										<span class="card-offers">{offers} ОФЕРТИ</span>
									{/if}
								</div>
							{:else}
								<div class="card-price-row">
									<span class="card-price-from">НЯМА НАЛИЧНОСТ</span>
								</div>
							{/if}
						</div>
					</a>
				{/each}

				{#if !data.perfumes?.length}
					<div class="empty-state">
						<span class="empty-title">Нищо тук, тихо.</span>
						<span class="label">НЕ НАМЕРИХМЕ ПАРФЮМИ С ТЕЗИ ФИЛТРИ</span>
						{#if hasFilters}
							<button class="empty-reset" onclick={clearAll}>ИЗЧИСТИ ФИЛТРИТЕ</button>
						{/if}
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
			<button class="close-btn" onclick={() => (filterOpen = false)} aria-label="Затвори">×</button>
		</div>

		<div class="search-group">
			<div class="filter-group-head">ТЪРСЕНЕ</div>
			<div class="search-wrap">
				<input
					class="search-input"
					type="search"
					placeholder="Търси парфюм..."
					bind:value={query}
					oninput={handleSearch}
				/>
				{#if query}
					<button class="search-clear" onclick={clearSearch} aria-label="Изчисти търсенето">×</button>
				{/if}
			</div>
		</div>

		<div class="filter-group">
			<div class="filter-group-head">МАРКА</div>
			{#if (data.houses?.length ?? 0) > 8}
				<input
					class="search-input house-search"
					type="search"
					placeholder="Намери марка..."
					bind:value={houseQuery}
				/>
			{/if}
			<div class="radio-list">
				{#each visibleHouses as house}
					<button class="radio-btn" class:active={selectedHouses.includes(house)} onclick={() => toggleHouse(house)}>
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
					<button class="radio-btn" class:active={selectedGender.includes(gender)} onclick={() => toggleGender(gender)}>
						<span class="radio-indicator" class:checked={selectedGender.includes(gender)}></span>
						<span class="radio-label">{genderLabel(gender)}</span>
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

	/* Sort control */
	.sort-control {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
	}

	.sort-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.16em;
		color: var(--mute);
	}

	.sort-select {
		font-family: 'Manrope', sans-serif;
		font-size: 13px;
		color: var(--ink);
		background: transparent;
		border: 0;
		border-bottom: 1px solid var(--ink);
		padding: 4px 2px;
		cursor: pointer;
		outline-offset: 4px;
	}

	/* Mobile toolbar */
	.mobile-toolbar {
		display: none;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
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
		flex-shrink: 0;
	}

	.filter-count {
		background: var(--ink);
		color: var(--cream);
		font-size: 9px;
		padding: 1px 6px;
		line-height: 1.5;
	}

	.mobile-sort {
		min-width: 0;
	}

	.mobile-sort .sort-select {
		max-width: 160px;
		text-overflow: ellipsis;
	}

	/* Applied filter chips */
	.applied-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 24px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 12px;
		border: 1px solid var(--ink);
		background: transparent;
		color: var(--ink);
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.1em;
		cursor: pointer;
		transition: background 150ms ease, color 150ms ease;
	}

	.chip:hover {
		background: var(--ink);
		color: var(--cream);
	}

	.chip-x {
		font-size: 13px;
		line-height: 1;
	}

	.chip-clear {
		border-color: transparent;
		color: var(--mute);
		text-decoration: underline;
		text-underline-offset: 4px;
	}

	.chip-clear:hover {
		background: transparent;
		color: var(--ink);
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

	.search-wrap {
		position: relative;
		margin-top: 10px;
	}

	.search-input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		font-family: 'Manrope', sans-serif;
		font-size: 14px;
		outline: none;
		transition: border-color 0.15s;
		appearance: none;
	}

	.search-input::-webkit-search-cancel-button {
		display: none;
	}

	.search-input:focus {
		border-color: var(--ink);
	}

	.search-clear {
		position: absolute;
		right: 6px;
		top: 50%;
		transform: translateY(-50%);
		background: transparent;
		border: 0;
		font-size: 18px;
		line-height: 1;
		color: var(--mute);
		cursor: pointer;
		padding: 4px 6px;
	}

	.search-clear:hover {
		color: var(--ink);
	}

	.house-search {
		margin-bottom: 14px;
		padding: 8px 10px;
		font-size: 13px;
	}

	.no-houses {
		font-family: 'Manrope', sans-serif;
		font-size: 13px;
		color: var(--mute);
		font-style: italic;
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
		margin-bottom: 24px;
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
		transition: transform 350ms ease;
	}

	.product-card:hover .card-image {
		transform: scale(1.03);
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
		gap: 2px;
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

	.card-offers {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.12em;
		color: var(--amber);
		margin-left: auto;
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

	.empty-reset {
		margin-top: 20px;
		padding: 14px 28px;
		background: var(--ink);
		color: var(--cream);
		border: 0;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		transition: background 150ms ease;
	}

	.empty-reset:hover {
		background: oklch(0.25 0.02 50);
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

		.applied-filters {
			margin-bottom: 16px;
		}

		.product-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.card-info {
			padding: 12px 12px 14px;
			gap: 4px;
		}

		.card-name {
			font-size: 19px;
		}

		.card-price {
			font-size: 18px;
		}

		.card-house,
		.card-conc {
			font-size: 9px;
		}

		.card-gender {
			top: 10px;
			right: 10px;
			font-size: 9px;
		}

		.card-open {
			display: none;
		}
	}
</style>
