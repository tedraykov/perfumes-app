import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ElinorScraper } from '$lib/server/scrapers/elinor';
import { ParfiumbgScraper } from '$lib/server/scrapers/parfiumbg';
import { initAttributesCache } from '$lib/server/db/attributes-mapping';
import { queue } from '$lib/server/queue';

await initAttributesCache();

new Worker(
  'perfumes',
  async (job: Job) => {
    switch (job.name) {
      case 'import-elinor':
        await new ElinorScraper(queue, job).scrape();
        break;

      case 'import-parfiumbg':
        await new ParfiumbgScraper().scrape();
        break;

      case 'import-parfiumbg-one':
        await new ParfiumbgScraper().scrapeOne(job.data.url);
        break;

      default:
        console.warn(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  }
);
