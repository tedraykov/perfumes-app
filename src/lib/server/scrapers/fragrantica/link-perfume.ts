import { supabase } from '$lib/server/supabase/client';
import { FragranticaClient } from './client';

/**
 * Get all perfumes from the database that don't have a fragrantica URL
 * and try to link them
 */
export default async function linkPerfumes() {
	// Get all perfumes that don't have a fragrantica URL
	const perfumes = await supabase.from('perfumes').select('*').is('fragrantica_url', null);

	if (!perfumes.data) {
		console.warn('No perfumes found');
		return;
	}

	console.log(`Linking ${perfumes.data.length} perfumes`);

	for (const perfume of perfumes.data) {
		const client = new FragranticaClient();
		const data = await client.searchFragrance(`${perfume.name} ${perfume.house}`);

		if (!data) {
			console.warn('No data found for:', perfume);
			continue;
		}

		await supabase
			.from('perfumes')
			.update({ fragrantica_url: data.fragrantica_url, image_url: data.image })
			.match({ id: perfume.id });

		await new Promise((resolve) => setTimeout(resolve, 200));
	}
}
