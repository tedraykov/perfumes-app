<script>
	import { goto } from '$app/navigation';
</script>

<div class="home">
	<div class="home-content">
		<span class="label">ПАРФЮМНА ПЛАТФОРМА</span>
		<h1 class="home-title">
			Открийте следващия<br />
			<em>любим аромат.</em>
		</h1>
		<p class="home-desc">
			Сравнете цените от водещи търговци на парфюми в България. Независими и нишови аромати, ясни цени.
		</p>
		<a href="/perfumes" class="cta-btn">КЪМ КАТАЛОГА →</a>
	</div>
</div>

<style>
	.home {
		min-height: calc(100vh - 62px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 80px 56px;
		background: var(--cream);
	}

	.home-content {
		max-width: 720px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0;
	}

	.label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		letter-spacing: 0.18em;
		color: var(--mute);
		text-transform: uppercase;
		margin-bottom: 18px;
	}

	.home-title {
		font-family: 'Cormorant Garamond', serif;
		font-weight: 600;
		font-size: 96px;
		line-height: 0.94;
		letter-spacing: -0.025em;
		margin: 0 0 24px;
	}

	.home-title em {
		font-style: italic;
		color: var(--amber);
		font-weight: 500;
	}

	.home-desc {
		font-family: 'Manrope', sans-serif;
		font-size: 16px;
		line-height: 1.6;
		color: var(--mute);
		max-width: 480px;
		margin: 0 0 40px;
	}

	.cta-btn {
		display: inline-block;
		padding: 18px 36px;
		background: var(--ink);
		color: var(--cream);
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		letter-spacing: 0.18em;
		transition: background 150ms ease;
	}

	.cta-btn:hover {
		background: oklch(0.25 0.02 50);
	}

	@media (max-width: 768px) {
		.home {
			padding: 60px 20px;
			min-height: calc(100vh - 58px);
		}

		.home-title {
			font-size: 52px;
		}
	}
</style>
