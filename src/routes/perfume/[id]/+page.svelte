<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { Perfume } from '$lib/server/db/schema';
	import { genderLabel } from '$lib';
	import FragranceInventory from './fragrance-inventory.svelte';
	import FragranticaButton from './fragrantica-button.svelte';
	import Notes from './notes.svelte';

	let { data: perfume }: { data: Perfume } = $props();

	let scraping = $state(false);
	let scrapeError = $state(false);

	onMount(async () => {
		if (perfume.fragrantica_url) return;
		scraping = true;
		scrapeError = false;
		try {
			const res = await fetch(`/perfume/${perfume.id}/fragrantica`, { method: 'POST' });
			if (res.ok) {
				await invalidateAll();
			} else {
				scrapeError = true;
			}
		} catch {
			scrapeError = true;
		} finally {
			scraping = false;
		}
	});

	function groupNotesByType(notes: Perfume['notes']) {
		const top: typeof notes = [];
		const middle: typeof notes = [];
		const base: typeof notes = [];
		const other: typeof notes = [];
		for (const n of notes ?? []) {
			switch (n.note_type?.toLowerCase()) {
				case 'top': top.push(n); break;
				case 'middle': middle.push(n); break;
				case 'base': base.push(n); break;
				default: other.push(n);
			}
		}
		return { top, middle, base, other };
	}

	const notes = $derived(groupNotesByType(perfume.notes));
	const hasPyramid = $derived(
		notes.top.length > 0 || notes.middle.length > 0 || notes.base.length > 0
	);
	const hasNotes = $derived(hasPyramid || notes.other.length > 0);
</script>

<svelte:head>
	<title>{perfume.name} — {perfume.house} · парфюмни ентусиасти</title>
	<meta
		name="description"
		content="Сравни цените за {perfume.house} {perfume.name} ({perfume.concentration}) от български търговци."
	/>
</svelte:head>

<div class="page">
	<!-- Breadcrumb -->
	<nav class="breadcrumb" aria-label="Навигационна пътека">
		<div class="breadcrumb-content">
			<span class="breadcrumb-inner">
				<a href="/perfumes" class="bc-link">КАТАЛОГ</a>
				<span class="bc-sep">  /  </span>
				<a href="/perfumes?houses={encodeURIComponent(perfume.house ?? '')}" class="bc-link"
					>{perfume.house?.toUpperCase()}</a
				>
				<span class="bc-sep">  /  </span>
				<span class="bc-current">{perfume.name?.toUpperCase()}</span>
			</span>
			<span class="bc-meta">{genderLabel(perfume.gender).toUpperCase()} · {perfume.concentration?.toUpperCase()}</span>
		</div>
	</nav>

	<!-- Hero: image | meta -->
	<section class="hero">
		<div class="hero-inner">
		<!-- Bottle / image -->
		<div class="hero-image-col">
			<div class="image-paper">
				{#if perfume.image_url}
					<img
						src={perfume.image_url}
						alt="{perfume.house} {perfume.name}"
						class="hero-image"
						fetchpriority="high"
					/>
				{:else}
					<div class="image-placeholder">
						<span class="placeholder-letter">{perfume.name?.[0]}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Meta -->
		<div class="hero-meta">
			<div>
				<span class="mono-label">{perfume.house?.toUpperCase()}</span>
				<h1 class="hero-name">{perfume.name}</h1>
				<span class="mono-label" style="text-transform:uppercase">
					{perfume.concentration} · {genderLabel(perfume.gender)}
				</span>
			</div>

			{#if perfume.description}
				<p class="hero-desc">&ldquo;{perfume.description}&rdquo;</p>
			{:else if scraping}
				<p class="scraping-hint">Зареждане на данни от Fragrantica…</p>
			{:else if scrapeError}
				<p class="scraping-hint scraping-error">Неуспешно свързване с Fragrantica.</p>
			{/if}

			<!-- Fragrantica link -->
			<div>
				<FragranticaButton {perfume} />
			</div>

			<!-- Inventory summary -->
			{#if perfume.inventory?.length}
				{@const prices = perfume.inventory.map((i) => i.price)}
				{@const minPrice = Math.min(...prices)}
				{@const maxPrice = Math.max(...prices)}
				<div class="price-summary">
					<div>
						<span class="mono-label">{perfume.inventory.length} ТЪРГОВЦА · ОТ</span>
						<div class="price-row">
							<span class="price-big">
								{new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(minPrice)}
							</span>
							{#if maxPrice !== minPrice}
								<span class="mono-label">
									— {new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(maxPrice)}
								</span>
							{/if}
						</div>
					</div>
					<a href="#sellers" class="compare-btn">СРАВНИ ТЪРГОВЦИТЕ ↓</a>
				</div>
			{/if}
		</div>
		</div>
	</section>

	<!-- Notes pyramid -->
	{#if hasNotes}
		<Notes {perfume} {notes} />
	{:else if scraping}
		<div class="notes-loading">
			<div class="notes-loading-inner">
				<span class="mono-label">ЗАРЕЖДАНЕ НА НОТКИТЕ…</span>
			</div>
		</div>
	{/if}

	<!-- Sellers / inventory -->
	{#if perfume.inventory?.length}
		<section id="sellers" class="sellers-section">
			<div class="sellers-inner">
				<div class="sellers-header">
					<div>
						<span class="mono-label">ОТКЪДЕ ДА КУПИШ</span>
						<h2 class="section-title">Сравни цените.</h2>
					</div>
				</div>
				<FragranceInventory inventory={perfume.inventory} />
			</div>
		</section>
	{/if}
</div>

<style>
	.page {
		min-height: 100vh;
		background: var(--cream);
		color: var(--ink);
	}

	/* Breadcrumb */
	.breadcrumb {
		border-bottom: 1px solid var(--line);
	}

	.breadcrumb-content {
		max-width: 1440px;
		margin: 0 auto;
		padding: 20px 56px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.breadcrumb-inner {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		color: var(--mute);
	}

	.bc-link {
		color: var(--mute);
		text-decoration: none;
		cursor: pointer;
		transition: color 0.15s;
	}

	.bc-link:hover {
		color: var(--ink);
	}

	.bc-sep {
		color: var(--mute);
	}

	.bc-current {
		color: var(--ink);
	}

	.bc-meta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		color: var(--mute);
	}

	/* Hero */
	.hero {
		border-bottom: 1px solid var(--line);
	}

	.hero-inner {
		max-width: 1440px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1.1fr 1fr;
	}

	.hero-image-col {
		border-right: 1px solid var(--line);
		min-height: 580px;
		position: relative;
	}

	.image-paper {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		left: min(0px, (1440px - 100vw) / 2);
		background: var(--paper);
		background-image: repeating-linear-gradient(
			90deg,
			rgba(26, 22, 18, 0.025) 0 1px,
			transparent 1px 6px
		);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-image {
		max-width: 60%;
		max-height: 80%;
		object-fit: contain;
		display: block;
	}

	.image-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.placeholder-letter {
		font-family: 'Cormorant Garamond', serif;
		font-size: 160px;
		font-style: italic;
		color: var(--line);
		font-weight: 600;
	}

	/* Meta column */
	.hero-meta {
		padding: 60px 56px;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 28px;
	}

	.mono-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--mute);
		display: block;
	}

	.hero-name {
		font-family: 'Cormorant Garamond', serif;
		font-weight: 600;
		font-size: 72px;
		line-height: 0.94;
		margin: 12px 0 8px;
		letter-spacing: -0.025em;
	}

	.hero-desc {
		font-family: 'Cormorant Garamond', serif;
		font-style: italic;
		font-size: 22px;
		line-height: 1.5;
		margin: 0;
		color: var(--ink);
	}

	/* Price summary */
	.price-summary {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-top: 18px;
		border-top: 1px solid var(--ink);
		gap: 16px;
		flex-wrap: wrap;
	}

	.price-row {
		margin-top: 6px;
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	.price-big {
		font-family: 'Cormorant Garamond', serif;
		font-size: 52px;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.compare-btn {
		padding: 16px 26px;
		background: var(--ink);
		color: var(--cream);
		border: 0;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		letter-spacing: 0.18em;
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
		display: inline-block;
	}

	/* Sellers section */
	.sellers-section {
		border-bottom: 1px solid var(--line);
	}

	.sellers-inner {
		max-width: 1440px;
		margin: 0 auto;
		padding: 80px 56px;
	}

	.sellers-header {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		margin-bottom: 40px;
		gap: 24px;
		max-width: 900px;
		margin-left: auto;
		margin-right: auto;
	}

	.section-title {
		font-family: 'Cormorant Garamond', serif;
		font-weight: 500;
		font-style: italic;
		font-size: 56px;
		line-height: 1;
		margin: 18px 0 0;
		letter-spacing: -0.01em;
	}

	.scraping-hint {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.14em;
		color: var(--mute);
		margin: 0;
	}

	.scraping-error {
		color: oklch(0.55 0.12 25);
	}

	.notes-loading {
		border-bottom: 1px solid var(--line);
	}

	.notes-loading-inner {
		max-width: 1440px;
		margin: 0 auto;
		padding: 48px 56px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.breadcrumb-content {
			padding: 14px 20px;
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}

		.hero-inner {
			grid-template-columns: 1fr;
		}

		.hero-image-col {
			min-height: 340px;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.hero-meta {
			padding: 32px 20px;
		}

		.hero-name {
			font-size: 48px;
		}

		.sellers-inner {
			padding: 40px 0;
		}

		.section-title {
			font-size: 40px;
		}
	}
</style>
