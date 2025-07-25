import { db } from '$lib/server/db';
import { perfumes as perfumesSchema, type Perfume } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { FragranticaClient } from './client';

/**
 * Get all perfumes from the database that don't have a fragrantica URL
 * and try to link them
 */
export default async function linkPerfumes() {
	// Get all perfumes that don't have a fragrantica URL
	const perfumes = await db.query.perfumes.findMany({
		where: (perfume, { isNull }) => isNull(perfume.fragrantica_url)
	});

	if (!perfumes) {
		console.warn('No perfumes found');
		return;
	}

	console.log(`Linking ${perfumes.length} perfumes`);

	for (const perfume of perfumes) {
		const client = new FragranticaClient();
		const data = await client.searchFragrance(`${perfume.name} ${perfume.house}`);

		if (!data) {
			console.warn('No data found for:', perfume);
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
