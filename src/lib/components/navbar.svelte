<script lang="ts">
	import { page } from '$app/stores';

	let mobileOpen = $state(false);

	function isActive(path: string) {
		return $page.url.pathname.startsWith(path);
	}
</script>

<header class="nav-header">
	<div class="nav-left">
		{#if mobileOpen}
			<!-- mobile close handled below -->
		{/if}
		<button class="hamburger" onclick={() => (mobileOpen = true)} aria-label="Меню">
			<span></span><span></span><span style="width:14px"></span>
		</button>
		<a href="/" class="logo">парфюмни ентусиасти<span class="dot">.</span></a>
		<nav class="desktop-nav">
			<a href="/perfumes" class:active={isActive('/perfumes')}>Каталог</a>
			<a href="/add-perfume" class:active={isActive('/add-perfume')}>Добави</a>
			<a href="/admin" class:active={isActive('/admin')}>Админ</a>
		</nav>
	</div>
</header>

{#if mobileOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="drawer-overlay" onclick={() => (mobileOpen = false)}></div>
	<div class="drawer">
		<div class="drawer-header">
			<a href="/" class="logo" onclick={() => (mobileOpen = false)}>
				парфюмни ентусиасти<span class="dot">.</span>
			</a>
			<button class="close-btn" onclick={() => (mobileOpen = false)}>×</button>
		</div>
		<nav class="drawer-nav">
			<a href="/perfumes" onclick={() => (mobileOpen = false)} class:active={isActive('/perfumes')}
				>Каталог</a
			>
			<a
				href="/add-perfume"
				onclick={() => (mobileOpen = false)}
				class:active={isActive('/add-perfume')}>Добави</a
			>
			<a href="/admin" onclick={() => (mobileOpen = false)} class:active={isActive('/admin')}
				>Админ</a
			>
		</nav>
	</div>
{/if}

<style>
	.nav-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 56px;
		border-bottom: 1px solid var(--line);
		position: sticky;
		top: 0;
		background: rgba(242, 237, 227, 0.92);
		backdrop-filter: blur(8px);
		z-index: 12;
	}

	.nav-left {
		display: flex;
		align-items: center;
		gap: 40px;
	}

	.logo {
		font-family: 'Cormorant Garamond', serif;
		font-size: 24px;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--ink);
		text-decoration: none;
	}

	.dot {
		color: var(--amber);
	}

	.desktop-nav {
		display: flex;
		gap: 28px;
	}

	.desktop-nav a {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--mute);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		padding-bottom: 3px;
		transition:
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.desktop-nav a:hover,
	.desktop-nav a.active {
		color: var(--ink);
		border-bottom-color: var(--ink);
	}

	.hamburger {
		display: none;
		flex-direction: column;
		gap: 4px;
		background: transparent;
		border: 0;
		padding: 0;
		cursor: pointer;
	}

	.hamburger span {
		display: block;
		width: 20px;
		height: 1px;
		background: var(--ink);
	}

	/* Mobile drawer */
	.drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(26, 22, 18, 0.4);
		z-index: 100;
	}

	.drawer {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 80%;
		max-width: 360px;
		background: var(--cream);
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 28px;
		z-index: 101;
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.close-btn {
		background: transparent;
		border: 0;
		font-size: 24px;
		cursor: pointer;
		color: var(--ink);
		padding: 0;
		line-height: 1;
	}

	.drawer-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 12px;
	}

	.drawer-nav a {
		font-family: 'Cormorant Garamond', serif;
		font-style: italic;
		font-size: 30px;
		font-weight: 500;
		padding: 10px 0;
		color: var(--mute);
		text-decoration: none;
		border-bottom: 1px solid var(--line);
	}

	.drawer-nav a.active {
		color: var(--ink);
	}

	@media (max-width: 768px) {
		.nav-header {
			padding: 18px 20px;
		}

		.desktop-nav {
			display: none;
		}

		.hamburger {
			display: flex;
		}
	}
</style>
