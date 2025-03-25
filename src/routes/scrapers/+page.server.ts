import { ElinorScraper } from '$lib/server/scrapers/elinor';
import linkPerfumes from '$lib/server/scrapers/fragrantica/link-perfume';
import { ParfiumbgScraper } from '$lib/server/scrapers/parfiumbg';
import type { Actions } from './$types';

export const actions = {
  'import-elinor': async (event) => {
    new ElinorScraper().scrape();
  },
  'link-to-fragrantica': async (event) => {
    await linkPerfumes();
  },
  'import-parfiumbg': async (event) => {
    console.log('importing from parfiumbg');
    new ParfiumbgScraper().scrape();
  },
  'import-parfiumbg-one': async ({ request }) => {
    const formData = await request.formData();
    const url = formData.get('url');

    new ParfiumbgScraper().scrapeOne(url || '');
  }
} satisfies Actions;
