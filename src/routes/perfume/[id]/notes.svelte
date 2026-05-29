<script lang="ts">
	import type { Perfume, PerfumeNote } from '$lib/server/db/schema';

	let {
		perfume,
		notes
	}: {
		perfume: Perfume;
		notes: {
			top: PerfumeNote[];
			middle: PerfumeNote[];
			base: PerfumeNote[];
			other: PerfumeNote[];
		};
	} = $props();

	const hasPyramid = $derived(
		notes.top.length > 0 || notes.middle.length > 0 || notes.base.length > 0
	);

	// Map tier key → display props (matches reference: middle = "heart")
	const TIERS = [
		{ key: 'top', label: 'Връхни нотки', tint: 'oklch(0.78 0.06 95)', barWidth: '35%' },
		{ key: 'middle', label: 'Средни нотки', tint: 'oklch(0.72 0.07 25)', barWidth: '65%' },
		{ key: 'base', label: 'Базови нотки', tint: 'oklch(0.55 0.05 50)', barWidth: '100%' }
	] as const;

	// Five organic blob paths from the reference design
	const BLOBS = [
		'M50,15 C75,15 90,40 88,60 C86,80 65,90 45,88 C25,86 12,62 18,42 C24,22 35,15 50,15 Z',
		'M50,18 C72,12 88,32 88,55 C88,78 68,90 48,86 C28,82 12,68 16,46 C20,24 35,22 50,18 Z',
		'M50,12 C70,18 90,30 86,55 C82,80 60,92 42,88 C24,84 14,60 18,40 C22,20 35,8 50,12 Z',
		'M50,14 C74,14 86,38 86,58 C86,82 62,90 46,86 C22,80 14,64 16,44 C18,28 32,18 50,14 Z',
		'M50,16 C72,18 88,36 84,58 C80,80 62,90 44,88 C24,86 16,60 20,40 C24,24 38,16 50,16 Z'
	];

	function blobSeed(name: string, index: number) {
		return ((name.charCodeAt(0) || 0) + index) % 5;
	}

	function catalogCode(name: string, index: number) {
		return `Nº${String((index + 1) * 7 + name.length).padStart(3, '0')}`;
	}

	function gradientId(name: string, index: number, tier: string) {
		return `note-${name.replace(/\s/g, '-')}-${index}-${tier}`;
	}

	const activeTiers = $derived(
		hasPyramid
			? TIERS
			: [{ key: 'other' as const, label: 'Нотки', tint: 'oklch(0.55 0.05 50)', barWidth: '100%' }]
	);

	function tierNotes(key: string): PerfumeNote[] {
		if (key === 'top') return notes.top;
		if (key === 'middle') return notes.middle;
		if (key === 'base') return notes.base;
		return notes.other;
	}
</script>

<section class="notes-section">
	<div class="notes-inner">
	<!-- Left intro column -->
	<div class="notes-intro">
		<span class="mono-label">ОБОНЯТЕЛНА ПИРАМИДА</span>
		<h2 class="section-title">Как се разкрива.</h2>
		<p class="intro-text">
			Връхните нотки се усещат първи. Средните нотки изграждат характера на парфюма. Базовите нотки
			остават най-дълго.
		</p>
	</div>

	<!-- Right pyramid grid -->
	<div class="pyramid-grid" style="grid-template-columns: repeat({activeTiers.length}, 1fr)">
		{#each activeTiers as tier, ti}
			{@const tierItems = tierNotes(tier.key)}
			{#if tierItems.length > 0}
				<div class="tier" class:border-right={ti < activeTiers.length - 1}>
					<!-- Amber progress bar at top -->
					<div class="tier-bar" style="width: {tier.barWidth}; background: var(--amber)"></div>

					<span class="tier-label">0{ti + 1} · {tier.label}</span>

					<div class="notes-grid">
						{#each tierItems as pn, ni}
							{@const name = pn.note?.name ?? ''}
							{@const seed = blobSeed(name, ni)}
							{@const gid = gradientId(name, ni, tier.key)}
							{@const code = catalogCode(name, ni)}
							{@const outline = BLOBS[(seed + 2) % 5]}

							<div class="note-item">
								<!-- Botanical specimen disc -->
								<div class="specimen">
									<svg viewBox="0 0 100 100" class="specimen-svg" aria-hidden="true">
										<defs>
											<radialGradient id={gid} cx="0.45" cy="0.35" r="0.7">
												<stop offset="0%" stop-color={tier.tint} stop-opacity="0.85" />
												<stop offset="100%" stop-color={tier.tint} stop-opacity="0.45" />
											</radialGradient>
											<clipPath id={`clip-${gid}`}>
												<path d={BLOBS[seed]} />
											</clipPath>
										</defs>

										{#if pn.note?.image_url}
											<!-- Gradient blob as base -->
											<path d={BLOBS[seed]} fill="url(#{gid})" />
											<!-- Image cropped to blob shape -->
											<image
												href={pn.note.image_url}
												x="0"
												y="0"
												width="100"
												height="100"
												preserveAspectRatio="xMidYMid meet"
												clip-path="url(#clip-{gid})"
											/>
											<!-- Subtle outline on top -->
											<path
												d={outline}
												fill="none"
												stroke="rgba(26,22,18,0.25)"
												stroke-width="0.8"
											/>
										{:else}
											<!-- No image: gradient blob + text inside -->
											<path d={BLOBS[seed]} fill="url(#{gid})" />
											<path
												d={outline}
												fill="none"
												stroke="rgba(26,22,18,0.18)"
												stroke-width="0.6"
											/>
										{/if}
									</svg>

									{#if !pn.note?.image_url}
										<div class="specimen-text">
											<span class="specimen-name">{name}</span>
											<span class="specimen-code">{code}</span>
										</div>
									{/if}
								</div>

								<!-- Name label below the disc -->
								<span class="note-name">{name}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>
	</div>
</section>

<style>
	.notes-section {
		border-bottom: 1px solid var(--line);
	}

	.notes-inner {
		max-width: 1440px;
		margin: 0 auto;
		padding: 80px 56px;
		display: grid;
		grid-template-columns: 1fr 2.4fr;
		gap: 64px;
		align-items: start;
	}

	/* Left intro */
	.notes-intro {
		display: flex;
		flex-direction: column;
	}

	.mono-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--mute);
		display: block;
	}

	.section-title {
		font-family: 'Cormorant Garamond', serif;
		font-weight: 500;
		font-style: italic;
		font-size: 56px;
		line-height: 1;
		margin: 18px 0 16px;
		letter-spacing: -0.01em;
	}

	.intro-text {
		font-family: 'Manrope', sans-serif;
		font-size: 14px;
		line-height: 1.7;
		color: var(--mute);
		margin: 0;
	}

	/* Right pyramid */
	.pyramid-grid {
		display: grid;
		border-top: 1px solid var(--ink);
	}

	.tier {
		padding: 28px 28px 36px;
		position: relative;
	}

	.tier.border-right {
		border-right: 1px solid var(--line);
	}

	.tier-bar {
		position: absolute;
		top: -1px;
		left: 0;
		height: 3px;
	}

	.tier-label {
		display: block;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.18em;
		color: var(--mute);
	}

	/* Note items grid: 2 columns */
	.notes-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin-top: 24px;
	}

	.note-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
	}

	/* Specimen disc — 90×90px circular with paper bg + blob */
	.specimen {
		width: 90px;
		height: 90px;
		border-radius: 50%;
		position: relative;
		background: var(--paper);
		background-image: repeating-linear-gradient(
			90deg,
			rgba(26, 22, 18, 0.035) 0 1px,
			transparent 1px 7px
		);
		border: 1px solid var(--line);
		overflow: hidden;
		flex-shrink: 0;
	}

	.specimen-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	/* Fallback text when no image */
	.specimen-text {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 0 12px;
	}

	.specimen-name {
		font-family: 'Cormorant Garamond', serif;
		font-style: italic;
		font-size: 14px;
		line-height: 1.05;
		color: var(--ink);
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.specimen-code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 5.6px;
		letter-spacing: 0.16em;
		color: var(--ink);
		opacity: 0.55;
		margin-top: 4px;
	}

	/* Note name below the disc */
	.note-name {
		font-family: 'Cormorant Garamond', serif;
		font-size: 20px;
		font-style: italic;
		line-height: 1.1;
		font-weight: 500;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.notes-grid {
			grid-template-columns: 1fr;
		}

		.specimen {
			width: 100px;
			height: 100px;
		}
	}

	@media (max-width: 768px) {
		.notes-inner {
			grid-template-columns: 1fr;
			padding: 40px 20px;
			gap: 32px;
		}

		.section-title {
			font-size: 36px;
		}

		.pyramid-grid {
			grid-template-columns: 1fr !important;
		}

		.tier.border-right {
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}

		.notes-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
		}

		.specimen {
			width: 80px;
			height: 80px;
		}
	}
</style>
