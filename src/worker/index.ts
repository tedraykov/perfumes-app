import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ElinorScraper } from '$lib/server/scrapers/elinor';
import { ParfiumbgScraper } from '$lib/server/scrapers/parfiumbg';
import { initAttributesCache } from '$lib/server/db/attributes-mapping';
import { BullJobObserver, connection, queue } from '$lib/server/queue';

await initAttributesCache();

const worker = new Worker(
	'perfumes',
	async (job: Job) => {
		const jobObserver = new BullJobObserver(queue, job);
		switch (job.name) {
			case 'import-elinor':
				await new ElinorScraper(jobObserver).scrape();
				break;

			case 'import-parfiumbg':
				await new ParfiumbgScraper(jobObserver).scrape();
				break;

			case 'import-parfiumbg-one':
				await new ParfiumbgScraper(jobObserver).scrapeOne(job.data.url);
				break;

			default:
				console.warn(`Unknown job type: ${job.name}`);
		}
	},
	{
		connection: new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
	}
);

// Graceful shutdown
const shutdown = async () => {
	console.log('Shutting down gracefully...');
	await worker.close(true); // stop processing new jobs
	await connection.quit(); // close Redis connection
	process.exit(0);
};

process.on('SIGINT', shutdown); // Ctrl+C
