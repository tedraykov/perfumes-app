<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import StopIcon from 'lucide-svelte/icons/square';
	import LoaderIcon from 'lucide-svelte/icons/loader-2';
	import PlayIcon from 'lucide-svelte/icons/play';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import type { Job } from 'bullmq';

	export type ScraperProps = {
		name: string;
		description: string;
		action: string;
		jobs?: Job[];
	};
	let { name, description, action, jobs }: ScraperProps = $props();
	let job = $derived((jobs || []).at(0));
	let jobData = $derived(parseJobData(job));

	function inferStatus(job: Job | undefined) {
		if (!job) return 'idle';

		if (job.finishedOn) return 'completed';

		if (job.failedReason === '\"Job was aborted\"') {
			return 'aborted';
		}

		if (job.failedReason) {
			return 'failed';
		}

		if (job.attemptsMade === job.attemptsStarted) return 'waiting';

		if (job.attemptsMade + 1 + job.stalledCounter === job.attemptsStarted) return 'running';

		return 'idle';
	}

	function parseJobData(job: Job | undefined) {
		if (!job) return undefined;
		try {
			return JSON.parse(job.data);
		} catch (error) {}
		return undefined;
	}

	function inferProgress(job: Job | undefined) {
		if (!job) return 0;
		return (+job.progress).toFixed();
	}
	let status = $derived(inferStatus(job));
	let progress = $derived(inferProgress(job));

	function isAbortInProgress(job: Job | undefined) {
		if (!job) return false;
		try {
			const jobData = JSON.parse(job.data);
			if (!jobData['aborted']) return false;

			if (job.failedReason) return false;
		} catch (err) {
			console.log('Job data has unexpected format');
			return false;
		}

		return true;
	}

	function inferStatusBadgeVariant(status: string): string | undefined {
		switch (status) {
			case 'failed':
				return 'destructive';
			case 'aborted':
				return 'destructive';
			case 'completed':
				return 'success';
			case 'running':
				return 'info';
			default:
				return 'secondary';
		}
	}
</script>

<Card>
	<CardContent class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<h4 class="flex-1 text-xl font-semibold">{name}</h4>
				<Badge variant={inferStatusBadgeVariant(status)}>{status}</Badge>
			</div>
			<p class="text-sm text-muted-foreground">{description}</p>
		</div>
		{#if status === 'running' || status === 'waiting'}
			<div class="flex items-center justify-center gap-4">
				<Progress value={progress || 0} />
				<span class="text-sm">{progress}%</span>
			</div>
			{#if jobData && jobData['processedItemsCount']}
				<p class="text-sm text-muted-foreground">
					Processed <span>{jobData['processedItemsCount']}</span> of
					<span>{jobData['totalItemsCount']}</span>
				</p>
			{/if}
		{/if}
		{#if status !== 'running' && status !== 'waiting'}
			<form method="POST" action={`?/${action}`}>
				<Button type="submit"><PlayIcon />Start</Button>
			</form>
		{:else if isAbortInProgress(job)}
			<Button variant="destructive" disabled class="w-fit"
				><LoaderIcon class="animate-spin" /> Aborting Job</Button
			>
		{:else}
			<form method="POST" action="?/abort-job">
				<input type="text" name="jobId" value={job?.id} hidden aria-hidden="true" />
				<Button variant="destructive" type="submit"><StopIcon />Abort Job</Button>
			</form>
		{/if}
	</CardContent>
</Card>
