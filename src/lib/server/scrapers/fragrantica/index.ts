import { db } from '$lib/server/db';
import { perfumes as perfumesSchema, type Perfume } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { FragranticaClient } from './client';
import logger from '$lib/server/logger';
export { scrapeFragranticaPage } from './scraper';
export type { ScrapedNote, FragranticaPageData } from './scraper';

const log = logger.child({ scraper: 'fragrantica' });

/**
 * Get all perfumes from the database that don't have a fragrantica URL
 * and try to link them
 */
export async function linkPerfumes() {
  // Get all perfumes that don't have a fragrantica URL
  const perfumes = await db.query.perfumes.findMany({
    where: (perfume, { isNull }) => isNull(perfume.fragrantica_url)
  });

  if (!perfumes) {
    log.warn('No perfumes found');
    return;
  }

  log.info({ count: perfumes.length }, 'Linking perfumes');

  for (const perfume of perfumes) {
    const client = new FragranticaClient();
    const data = await client.searchFragrance(`${perfume.name} ${perfume.house}`);

    if (!data) {
      log.warn({ perfume }, 'No data found for perfume');
      continue;
    }

    const setValues: Partial<Perfume> = {
      fragrantica_url: data.fragrantica_url,
      fragrantica_name: data.name
    };

    if (!perfume.image_url) {
      setValues.image_url = data.image;
    }

    await db.update(perfumesSchema).set(setValues).where(eq(perfumesSchema.id, perfume.id));

    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

export async function linkPerfume(id: number) { }
