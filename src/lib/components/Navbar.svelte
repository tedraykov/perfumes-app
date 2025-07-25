<script>
	import { Button } from '$lib/components/ui/button';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';

	/** @type {{ user: {name: string} | undefined }} */
	let data = $props();

	let loggedIn = $derived(Boolean(data.user));

	/** @param {CustomEvent} event */
	async function logout(event) {
		event.preventDefault();
		await fetch('/?/logout', {
			method: 'POST',
			body: new FormData()
		});
		location.reload();
	}
</script>

<nav class="border-b bg-background">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<div class="flex flex-shrink-0 items-center">
					<span class="text-2xl font-bold text-primary">Парфюмни Ентусиасти</span>
				</div>
				<div class="hidden items-center sm:ml-6 sm:flex sm:space-x-8">
					<a href="/" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-primary"
						>Home</a
					>
					<a
						href="/perfumes"
						class="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-primary"
						>Perfumes</a
					>
					<a
						href="/scrapers"
						class="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-primary"
						>Scrapers</a
					>
					<Button href="/add-perfume">Добави парфюм</Button>
				</div>
			</div>
			<!-- <div class="flex items-center"> -->
			<!-- 	{#if loggedIn} -->
			<!-- 		<DropdownMenu> -->
			<!-- 			<DropdownMenuTrigger> -->
			<!-- 				<Avatar> -->
			<!-- 					<AvatarFallback>{data.user.name}</AvatarFallback> -->
			<!-- 				</Avatar> -->
			<!-- 			</DropdownMenuTrigger> -->
			<!-- 			<DropdownMenuContent> -->
			<!-- 				<DropdownMenuItem on:click={logout}>Log out</DropdownMenuItem> -->
			<!-- 			</DropdownMenuContent> -->
			<!-- 		</DropdownMenu> -->
			<!-- 	{:else} -->
			<!-- 		<Button href="/login">Log in</Button> -->
			<!-- 	{/if} -->
			<!-- </div> -->
		</div>
	</div>
</nav>
