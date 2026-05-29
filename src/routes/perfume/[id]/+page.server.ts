import { db } from '$lib/server/db';
import { notes, perfume_notes, perfumes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import logger from '$lib/server/logger';
import { scrapeFragranticaPage } from '$lib/server/scrapers/fragrantica';

const log = logger.child({ module: 'perfume-page' });

export async function load({ params }: PageServerLoad) {
  const perfume = await db.query.perfumes.findFirst({
    where: (perfumes, { eq }) => eq(perfumes.id, +params.id),
    with: {
      inventory: {
        with: {
          website: true
        }
      },
      notes: {
        with: {
          note: true
        }
      }
    }
  });

  return perfume;
}

function parseFragranticaLink(url: string): string | undefined {
  // URL pattern: https://www.fragrantica.com/perfume/{House}/{Name}-{id}.html
  const match = url.match(/\/perfume\/[^/]+\/(.+)-\d+\.html/);
  if (!match) {
    log.error({ url }, 'Failed to parse Fragrantica URL');
    return undefined;
  }
  return match[1].replace(/-/g, ' ');
}
export const actions = {
  'link-fragrantica': async (event) => {
    const formData = await event.request.formData();
    const fragranticaLink = formData.get('fragranticaLink');
    const perfumeId = formData.get('perfumeId');

    if (!perfumeId || !fragranticaLink) {
      return fail(400);
    }

    const url = fragranticaLink.toString();
    const fragranticaName = parseFragranticaLink(url);
    if (!fragranticaName) {
      return fail(400);
    }

    const id = +perfumeId;
    const scraped = await scrapeFragranticaPage(url);

    await db
      .update(perfumes)
      .set({
        fragrantica_url: url,
        fragrantica_name: fragranticaName,
        ...(scraped.image_url ? { image_url: scraped.image_url } : {}),
        ...(scraped.description ? { description: scraped.description } : {})
      })
      .where(eq(perfumes.id, id));

    if (scraped.notes.length > 0) {
      // Upsert note definitions
      await db
        .insert(notes)
        .values(scraped.notes.map((n) => ({ name: n.name, image_url: n.image_url })))
        .onConflictDoNothing();

      // Replace existing notes for this perfume
      await db.delete(perfume_notes).where(eq(perfume_notes.perfume_id, id));
      await db.insert(perfume_notes).values(
        scraped.notes.map((n) => ({
          perfume_id: id,
          note_name: n.name,
          note_type: n.note_type
        }))
      );
    }
  }
} satisfies Actions;
