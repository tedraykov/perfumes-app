<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	type NavbarProps = {
		user:
			| {
					name: string;
			  }
			| undefined;
	};
	let data: NavbarProps = $props();

	// let loggedIn = $derived(Boolean(data.user));
	//
	// async function logout(event: CustomEvent) {
	// 	event.preventDefault();
	// 	await fetch('/?/logout', {
	// 		method: 'POST',
	// 		body: new FormData()
	// 	});
	// 	location.reload();
	// }
</script>

<nav class="border-b bg-background">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<div class="flex flex-shrink-0 items-center">
					<span class="text-2xl font-bold text-primary">Парфюмни Ентусиасти</span>
				</div>
				<div class="hidden items-center sm:ml-6 sm:flex sm:space-x-8">
					<a
						href="/perfumes"
						class="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-primary"
						>Парфюми</a
					>
					<a
						href="/admin"
						class="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-primary"
						>Admin</a
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
