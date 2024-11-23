import { fail } from '@sveltejs/kit';
import { addPerfume } from '$lib/appwrite';

/**
 * @typedef {import('$lib/appwrite/types').PerfumeEntusiastsPerfumeType} PerfumeEntusiastsPerfumeType
 */

/**
 * @param {string} url
 * @returns {Promise<PerfumeEntusiastsPerfumeType>}
 */
async function parseFragranticaLink(url) {
  // TODO: Implement actual scraping logic
  return {
    name: 'Scraped Perfume Name',
    house: 'Scraped House',
    notes: []
  };
}

/** @type {import('./$types').Actions} */
export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const fragranticaLink = formData.get('fragranticaLink');

    try {
      /** @type {PerfumeEntusiastsPerfumeType} */
      let perfumeInput;

      if (fragranticaLink) {
        // Parse Fragrantica link
        perfumeInput = await parseFragranticaLink(fragranticaLink.toString());
      } else {
        // Handle manual input
        const name = formData.get('name');
        const house = formData.get('house');
        const notes = formData.get('notes');

        if (!name || !house || !notes) {
          return fail(400, { success: false, message: 'Missing required fields' });
        }

        perfumeInput = {
          name: name.toString(),
          house: house.toString()
        };
      }

      // Save to your database
      const perfume = await addPerfume(perfumeInput);

      return { success: true, data: perfume };
    } catch (error) {
      console.error('Error adding perfume:', error);
      return fail(500, { success: false, message: 'Failed to add perfume. Please try again.' });
    }
  }
};
