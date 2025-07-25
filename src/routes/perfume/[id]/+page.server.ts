import { db } from '$lib/server/db';
import * as cheerio from 'cheerio';
import { perfumes, type Note, type PerfumeNote } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export async function load({ params }: PageServerLoad) {
	// Mock Note definitions
	const lemon: Note = { name: 'Lemon', image_url: 'https://fimgs.net/mdimg/sastojci/t.77.jpg' };
	const pineapple: Note = {
		name: 'Pineapple',
		image_url: 'https://fimgs.net/mdimg/sastojci/t.170.jpg'
	};
	const bergamot: Note = {
		name: 'Bergamot',
		image_url: 'https://fimgs.net/mdimg/sastojci/t.75.jpg'
	};
	const blackCurrant: Note = {
		name: 'Black Currant',
		image_url: 'https://fimgs.net/mdimg/sastojci/t.132.jpg'
	};
	const apple: Note = { name: 'Apple', image_url: 'https://fimgs.net/mdimg/sastojci/t.146.jpg' };

	const birch: Note = { name: 'Birch', image_url: 'https://fimgs.net/mdimg/sastojci/t.31.jpg' };
	const jasmine: Note = { name: 'Jasmine', image_url: 'https://fimgs.net/mdimg/sastojci/t.14.jpg' };
	const rose: Note = { name: 'Rose', image_url: 'https://fimgs.net/mdimg/sastojci/t.105.jpg' };

	const ambergris: Note = {
		name: 'Ambergris',
		image_url: 'https://fimgs.net/mdimg/sastojci/t.524.jpg'
	};
	const musk: Note = { name: 'Musk', image_url: 'https://fimgs.net/mdimg/sastojci/t.4.jpg' };
	const patchouli: Note = {
		name: 'Patchouli',
		image_url: 'https://fimgs.net/mdimg/sastojci/t.34.jpg'
	};
	const vanilla: Note = { name: 'Vanilla', image_url: 'https://fimgs.net/mdimg/sastojci/t.74.jpg' };

	// Mock PerfumeNote array
	const mockPerfumeNotes: PerfumeNote[] = [
		{ perfume_id: 1, note: lemon, note_name: 'Lemon', note_type: 'top' },
		{ perfume_id: 1, note: pineapple, note_name: 'Pineapple', note_type: 'top' },
		{ perfume_id: 1, note: bergamot, note_name: 'Bergamot', note_type: 'top' },
		{ perfume_id: 1, note: blackCurrant, note_name: 'Black Currant', note_type: 'top' },
		{ perfume_id: 1, note: apple, note_name: 'Apple', note_type: 'top' },

		{ perfume_id: 1, note: birch, note_name: 'Birch', note_type: 'middle' },
		{ perfume_id: 1, note: jasmine, note_name: 'Jasmine', note_type: 'middle' },
		{ perfume_id: 1, note: rose, note_name: 'Rose', note_type: 'middle' },

		{ perfume_id: 1, note: ambergris, note_name: 'Ambergris', note_type: 'base' },
		{ perfume_id: 1, note: musk, note_name: 'Musk', note_type: 'base' },
		{ perfume_id: 1, note: patchouli, note_name: 'Patchouli', note_type: 'base' },
		{ perfume_id: 1, note: vanilla, note_name: 'Vanilla', note_type: 'base' }
	];

	const perfume = await db.query.perfumes.findFirst({
		where: (perfumes, { eq }) => eq(perfumes.id, +params.id),
		with: {
			inventory: {
				with: {
					website: true
				}
			},
			notes: true
		}
	});

	if (perfume) {
		perfume.notes = mockPerfumeNotes;
	}
	return perfume;
}

async function parseFragranticaLink(url: string) {
	try {
		// Fetch the HTML content of the page
		const response = await fetch(url);

		const html = await response.text();

		// Load the HTML into Cheerio
		const $ = cheerio.load(html);

		// Select the product name
		const productName = $('h1[itemprop="name"]').contents().first().text().trim();

		if (!productName) {
			throw new Error('Failed to extract required details from the page');
		}

		return productName;
	} catch (error) {
		console.error('Error scraping Fragrantica:', (error as Error).message);
	}

	return undefined;
}
export const actions = {
	'link-fragrantica': async (event) => {
		const formData = await event.request.formData();
		const fragranticaLink = formData.get('fragranticaLink');
		const perfumeId = formData.get('perfumeId');

		if (!perfumeId || !fragranticaLink) {
			return fail(501);
		}
		let fragranticaName: string | undefined;
		try {
			fragranticaName = await parseFragranticaLink(fragranticaLink.toString());
		} catch (error) {}

		if (!fragranticaName) {
			return fail(501);
		}

		await db
			.update(perfumes)
			.set({
				fragrantica_url: fragranticaLink.toString(),
				fragrantica_name: fragranticaName.toString()
			})
			.where(eq(perfumes.id, perfumeId.toString()));
	}
} satisfies Actions;
