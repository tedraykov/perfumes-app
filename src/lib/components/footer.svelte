<script>
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="footer-top">
		<div class="footer-brand">
			<a href="/" class="footer-logo">парфюмни ентусиасти<span class="dot">.</span></a>
			<p class="footer-tagline">
				Сравняваме цените на парфюми от водещи български търговци — независимо и без надценка.
			</p>
		</div>

		<nav class="footer-col" aria-label="Навигация">
			<span class="footer-head">НАВИГАЦИЯ</span>
			<a href="/perfumes">Каталог</a>
			<a href="/add-perfume">Добави парфюм</a>
		</nav>

		<nav class="footer-col" aria-label="Правна информация">
			<span class="footer-head">ПРАВНО</span>
			<a href="/terms-of-use">Условия за ползване</a>
			<a href="/privacy-policy">Поверителност</a>
		</nav>
	</div>

	<div class="footer-bottom">
		<span>© {year} ПАРФЮМНИ ЕНТУСИАСТИ</span>
		<span>СРАВНЕНИЕ НА ЦЕНИ ОТ БЪЛГАРСКИ МАГАЗИНИ</span>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--line);
		background: var(--cream);
	}

	.footer-top {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 48px;
		padding: 56px;
	}

	.footer-logo {
		font-family: 'Cormorant Garamond', serif;
		font-size: 22px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--ink);
		text-decoration: none;
	}

	.dot {
		color: var(--amber);
	}

	.footer-tagline {
		font-family: 'Manrope', sans-serif;
		font-size: 13.5px;
		line-height: 1.6;
		color: var(--mute);
		max-width: 340px;
		margin: 14px 0 0;
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.footer-head {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.18em;
		color: var(--mute);
		border-top: 1px solid var(--ink);
		padding-top: 10px;
		margin-bottom: 6px;
	}

	.footer-col a {
		font-family: 'Manrope', sans-serif;
		font-size: 14px;
		color: var(--ink);
		text-decoration: none;
		width: fit-content;
		border-bottom: 1px solid transparent;
		transition: border-color 0.15s ease;
	}

	.footer-col a:hover {
		border-bottom-color: var(--ink);
	}

	.footer-bottom {
		display: flex;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		padding: 18px 56px;
		border-top: 1px solid var(--line);
		font-family: 'JetBrains Mono', monospace;
		font-size: 9.5px;
		letter-spacing: 0.16em;
		color: var(--mute);
	}

	@media (max-width: 768px) {
		.footer-top {
			grid-template-columns: 1fr;
			gap: 32px;
			padding: 40px 20px;
		}

		.footer-bottom {
			padding: 16px 20px;
		}
	}
</style>
