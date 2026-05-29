import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ElinorScraper } from '$lib/server/scrapers/elinor';
import { ParfiumbgScraper } from '$lib/server/scrapers/parfiumbg';
import { initAttributesCache } from '$lib/server/db/attributes-mapping';
import { BullJobObserver, connection, queue } from '$lib/server/queue';
import logger from '$lib/server/logger';

const log = logger.child({ module: 'worker' });

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
        log.warn({ jobName: job.name }, 'Unknown job type');
    }
  },
  {
    connection: new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null }),
    lockDuration: 300_000 // 5 minutes — scraping jobs run much longer than the 30s default
  }
);

// Graceful shutdown
const shutdown = async () => {
  log.info('Shutting down gracefully');
  await worker.close(true); // stop processing new jobs
  await connection.quit(); // close Redis connection
  process.exit(0);
};

process.on('SIGINT', shutdown);
