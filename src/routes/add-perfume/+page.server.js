import { createSessionClient } from '$lib/server/appwrite';
import { fail, redirect } from '@sveltejs/kit';
import * as cheerio from 'cheerio';

/**
 * @typedef {import('$lib/server/appwrite/codegen').PerfumeEntusiastsPerfumeType} PerfumeEntusiastsPerfumeType
 * @typedef {import('$lib/server/appwrite/codegen').URL} URL
 */

/**
 * @param {string} url
 * @returns {Promise<PerfumeEntusiastsPerfumeType | undefined>}
 */
async function parseFragranticaLink(url) {
	try {
		// Fetch the HTML content of the page
		const response = await fetch(url);

		const html = await response.text();

		// Load the HTML into Cheerio
		const $ = cheerio.load(html);

		// Select the product name
		const productName = $('h1[itemprop="name"]').contents().first().text().trim();

		// Select the brand name
		const brandName = $('p[itemprop="brand"] span[itemprop="name"]').text().trim();

		// Select the product image URL
		/** @type {URL | undefined} */
		// @ts-ignore
		const productImage = $('img[itemprop="image"]').attr('src');

		if (!productName || !brandName || !productImage) {
			throw new Error('Failed to extract required details from the page');
		}

		return {
			name: productName,
			house: brandName,
			image: productImage,
			notes: [],
			// @ts-ignore
			fragrantica_url: url
		};
	} catch (error) {
		console.error('Error scraping Fragrantica:', error.message);
	}
}

/**
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export const load = ({ locals }) => {
	if (!locals.user) throw redirect(301, '/login');

	return {
		user: locals.user
	};
};

/** @type {import('./$types').Actions} */
export const actions = {
	default: async (event) => {
		const { addPerfume } = createSessionClient(event);

		const formData = await event.request.formData();
		const fragranticaLink = formData.get('fragranticaLink');

		try {
			/** @type {PerfumeEntusiastsPerfumeType | undefined} */
			let perfumeInput;

			if (fragranticaLink) {
				// Parse Fragrantica link
				perfumeInput = await parseFragranticaLink(fragranticaLink.toString());
			} else {
				// Handle manual input
				const name = formData.get('name');
				const house = formData.get('house');
				// const notes = formData.get('notes');

				if (name && house) {
					perfumeInput = {
						name: name?.toString(),
						house: house?.toString()
					};
				}
			}

			if (!perfumeInput) {
				return fail(400, {
					success: false,
					message:
						'Invalid input. Please provide a valid Fragrantica link or fill in the required fields.'
				});
			}

			// Save to your database
			const perfume = await addPerfume(perfumeInput);
			// const perfume = perfumeInput;

			return { success: true, data: perfume };
		} catch (error) {
			console.error('Error adding perfume:', error);
			return fail(500, { success: false, message: 'Failed to add perfume. Please try again.' });
		}
	}
};
