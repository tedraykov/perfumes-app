<script>
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
</script>

<div class="container">
	<form method="POST" use:enhance class="flex max-w-sm flex-col gap-4">
		<Label for="email">Email</Label>
		<Input type="email" id="email" name="email" required />
		<Label for="password">Password</Label>
		<Input type="password" id="password" name="password" required minlength="8" />
		<Button type="submit">Login</Button>
	</form>
</div>
