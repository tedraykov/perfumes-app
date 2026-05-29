import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notes, perfume_notes, perfumes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { FragranticaClient } from '$lib/server/scrapers/fragrantica/client';
import { scrapeFragranticaPage } from '$lib/server/scrapers/fragrantica/scraper';
import logger from '$lib/server/logger';
import type { RequestHandler } from './$types';

const log = logger.child({ module: 'fragrantica-api' });

export const POST: RequestHandler = async ({ params }) => {
	const id = +params.id;

	const perfume = await db.query.perfumes.findFirst({
		where: (p, { eq }) => eq(p.id, id)
	});

	if (!perfume) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	let url = perfume.fragrantica_url;

	if (!url) {
		const client = new FragranticaClient();
		const nameContainsHouse = perfume.name.toLowerCase().includes(perfume.house.toLowerCase());
		const query = nameContainsHouse ? perfume.name : `${perfume.name} ${perfume.house}`;
		const result = await client.searchFragrance(query);
		if (!result) {
			log.warn({ id, name: perfume.name }, 'Could not find perfume on Fragrantica');
			return json({ error: 'Could not find on Fragrantica' }, { status: 422 });
		}
		url = result.fragrantica_url;
		await db
			.update(perfumes)
			.set({ fragrantica_url: url, fragrantica_name: result.name })
			.where(eq(perfumes.id, id));
	}

	const scraped = await scrapeFragranticaPage(url);

	await db
		.update(perfumes)
		.set({
			...(scraped.image_url ? { image_url: scraped.image_url } : {}),
			...(scraped.description ? { description: scraped.description } : {})
		})
		.where(eq(perfumes.id, id));

	if (scraped.notes.length > 0) {
		await db
			.insert(notes)
			.values(scraped.notes.map((n) => ({ name: n.name, image_url: n.image_url })))
			.onConflictDoNothing();

		await db.delete(perfume_notes).where(eq(perfume_notes.perfume_id, id));
		await db.insert(perfume_notes).values(
			scraped.notes.map((n) => ({
				perfume_id: id,
				note_name: n.name,
				note_type: n.note_type
			}))
		);
	}

	return json({ ok: true });
};
