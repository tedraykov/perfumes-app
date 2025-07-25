import { db } from '$lib/server/db';
import { perfumes, type NewPerfume } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import * as cheerio from 'cheerio';

async function parseFragranticaLink(url: string): Promise<NewPerfume | undefined> {
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

    const productImage = $('img[itemprop="image"]').attr('src');

    if (!productName || !brandName || !productImage) {
      throw new Error('Failed to extract required details from the page');
    }

    return {
      name: productName,
      house: brandName,
      image_url: productImage,
      fragrantica_url: url,
      // TODO: use real value
      gender: 'unisex',
      concentration: 'EDT'
    };
  } catch (error) {
    console.error('Error scraping Fragrantica:', (error as Error).message);
  }

  return undefined;
}

export const actions = {
  default: async (event) => {
    const formData = await event.request.formData();
    const fragranticaLink = formData.get('fragranticaLink');

    let perfumeInput: NewPerfume | undefined;

    try {
      if (fragranticaLink) {
        // Parse Fragrantica link
        perfumeInput = await parseFragranticaLink(fragranticaLink.toString());
      } else {
        // // Handle manual input
        // const name = formData.get('name');
        // const house = formData.get('house');
        // // const notes = formData.get('notes');
        //
        // if (name && house) {
        //   perfumeInput = {
        //     name: name?.toString(),
        //     house: house?.toString()
        //   };
        // }
        return fail(501, {
          success: false,
          message: 'Adding perfume manually is not supported yet'
        });
      }

      if (!perfumeInput) {
        return fail(400, {
          success: false,
          message:
            'Invalid input. Please provide a valid Fragrantica link or fill in the required fields.'
        });
      }

      // Save to your database
      const perfume = await db.insert(perfumes).values(perfumeInput).returning();

      return { success: true, data: perfume };
    } catch (error) {
      console.error('Error adding perfume:', error);
      return fail(500, { success: false, message: 'Failed to add perfume. Please try again.' });
    }
  }
};
