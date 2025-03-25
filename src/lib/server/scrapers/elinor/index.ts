import * as cheerio from 'cheerio';
import type { Database } from '../../supabase/types';
import { supabase } from '$lib/server/supabase/client.js';

type Perfume = Database['public']['Tables']['perfumes']['Row'];
type PerfumeInventory = Database['public']['Tables']['perfume_inventory']['Row'];

type PerfumeData = {
	perfume: Partial<Perfume>;
	inventory: Partial<PerfumeInventory>[];
};

const descriptionAttributes = {
	'Парфюм EDP Тестер за мъже': {
		concentration: 'EDP',
		tester: true,
		gender: 'men'
	},
	'Парфюм EDP за жени': { concentration: 'EDP', gender: 'women' },
	'Комплект с Парфюм EDP за жени': {
		concentration: 'EDP',
		gender: 'women',
		set: true
	},
	'Парфюм EDP за мъже': { concentration: 'EDP', gender: 'men' },
	'Парфюм EDT Тестер за мъже': {
		concentration: 'EDT',
		tester: true,
		gender: 'men'
	},
	'Парфюм EDT': { concentration: 'EDT' },
	'Парфюм EDP': { concentration: 'EDP' },
	'EDC Тестер': { concentration: 'EDC', tester: true },
	'EDC Тестер за жени': { concentration: 'EDC', tester: true, gender: 'women' },
	'Парфюм EDT за мъже': { concentration: 'EDT', gender: 'men' },
	'Парфюм EDT за жени': { concentration: 'EDT', gender: 'women' },
	'Комплект с Парфюм EDP за мъже': {
		concentration: 'EDP',
		gender: 'men',
		set: true
	},
	'Парфюм EDP Тестер за жени': {
		concentration: 'EDP',
		tester: true,
		gender: 'women'
	},
	'Комплект с Парфюм EDT за жени': {
		concentration: 'EDT',
		gender: 'women',
		set: true
	},
	'Комплект с Парфюм EDT за мъже': {
		concentration: 'EDT',
		gender: 'men',
		set: true
	},
	'Perfumed Oil': { concentration: 'Oil' },
	'Extrait de Parfum': { concentration: 'Extrait' },
	'Парфюм EDP Тестер': { concentration: 'EDP', tester: true },
	'Парфюм EDT Тестер за жени': {
		concentration: 'EDT',
		tester: true,
		gender: 'women'
	},
	'Extrait de Parfum Тестер': { concentration: 'Extrait', tester: true },
	'Extrait de parfum': { concentration: 'Extrait' },
	'Parfem за жени': { concentration: 'Perfume', gender: 'women' },
	'Комплект с Парфюм EDT': { concentration: 'EDT', set: true },
	'Одеколон за мъже': { concentration: 'EDC', gender: 'men' },
	'Комплект с Parfem': { concentration: 'Perfume', set: true },
	'Perfume Extract': { concentration: 'Perfume' },
	'Парфюм EDT Тестер': { concentration: 'EDT', tester: true },
	'Комплект с Parfem за мъже': {
		concentration: 'Perfume',
		gender: 'men',
		set: true
	},
	'Parfem за мъже': { concentration: 'Perfume', gender: 'men' },
	'EDC за мъже': { concentration: 'EDC', gender: 'men' },
	Parfem: { concentration: 'Perfume' },
	Parfum: { concentration: 'Perfume' },
	'Афтършейв за мъже': { gender: 'men' }
};

async function requestElinorPerfumes(page: number = 1) {
	const url = 'https://elinor.bg/product-list?skipOrderInit=1&skipCountryInit=1';

	const formData = new FormData();
	formData.append('productCategoryId', '56');
	formData.append('filterParams[minPrice]', '0');
	formData.append('filterParams[maxPrice]', '1370');
	formData.append('orderBy', 'id-desc');
	formData.append('perPage', '80');
	formData.append('page', String(page));

	const response = await fetch(url, {
		method: 'POST',
		body: formData
	});

	return response.json();
}

function parseDescription(description: string) {
	const attributes = descriptionAttributes[description];
	if (!attributes) {
		console.error('Unknown description:', description);
		return {};
	}

	return attributes;
}

async function getPerfumeInventory(url: string) {
	const fullUrl = `https://elinor.bg${url}`;
	const response = await fetch(fullUrl);
	console.log('Perfume inventory url:', fullUrl);
	const html = await response.text();

	const $ = cheerio.load(html);

	const products: Partial<PerfumeInventory>[] = [];

	$('.orderable-product').each((_, element) => {
		const volumeText = $(element).find('.volume').text().trim().replace('ml', '');
		const priceText = $(element)
			.find('.regular-price')
			.text()
			.trim()
			.replace('лв.', '')
			.replace(',', '.');

		const volume = parseFloat(volumeText);
		const price = parseFloat(priceText);

		if (volume && price) {
			products.push({ volume, price, website: 'elinor', is_tester: false, url: fullUrl });
		}
	});
	await new Promise((resolve) => setTimeout(resolve, 100));
	return products;
}

export class ElinorScraper {
	totalPages: number = 0;
	allHouses: string[] = [];

	async scrape() {
		this.totalPages = await this.getTotalPages();
		this.allHouses = await this.getAllHouses();

		await this.scrapeAllPerfumes();
	}
	async scrapeAllPerfumes() {
		for (let page = 1; page <= this.totalPages; page++) {
			await this.getPerfumes(page);

			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	async getTotalPages() {
		const data = await requestElinorPerfumes(1);

		return Math.floor(data.totalItemsCount / 80);
	}

	async getAllHouses() {
		const data = await requestElinorPerfumes();
		const houseFilter = data.filter['1'];

		return houseFilter.options.map(({ label }: { label: string }) => label);
	}

	async getPerfumes(page: number): Promise<PerfumeData[]> {
		const data = await requestElinorPerfumes(page);

		const $ = cheerio.load(data.listItems);
		const perfumes: PerfumeData[] = [];

		// Extract perfume details
		for (const product of $('.product-list-item')) {
			const element = $(product);

			const nameAndHouse = element.find('.product-list-item-name').text().trim();
			const { name, house } = this.parseNameAndHouse(nameAndHouse);
			const description = element.find('.product-list-item-description').text().trim();

			const { gender = 'unisex', concentration, set } = parseDescription(description);

			if (set) {
				continue;
			}

			const imageUrl = element.find('.product-list-item-image').attr('data-first-src') || null;
			const link = element.find('.product-list-item-link').attr('href');

			if (!link) {
				console.error('No link found for:', name);
				continue;
			}

			const inventory = await getPerfumeInventory(link);

			const perfume: Partial<Perfume> = {
				name,
				image_url: `https://elinor.bg${imageUrl}`,
				house
			};

			if (gender) {
				perfume.gender = gender;
			}

			if (concentration) {
				perfume.concentration = concentration;
			}

			this.processor({ perfume, inventory });
		}
		return perfumes;
	}

	/**
	 * The full name of an elinor perfume starts with the house name followed by the perfume name
	 * separated by a space. This function extracts the house name and the perfume name from the full name
	 */
	parseNameAndHouse(nameAndHouse: string): { name: string; house: string } {
		const house = this.allHouses.find((house) => nameAndHouse.startsWith(house));
		if (!house) {
			console.error('No house found for:', nameAndHouse);
			return { name: nameAndHouse, house: '' };
		}
		const name = nameAndHouse.replace(house, '').trim();

		return { name, house };
	}

	async processor({ perfume, inventory }: PerfumeData) {
		const response = await supabase
			.from('perfumes')
			.upsert(perfume, { onConflict: 'name, house, gender, concentration' })
			.select();
		const perfumeId = response.data && response.data[0].id;

		if (!perfumeId) {
			console.error('Upsert failed for perfume. No data returned', perfume);
			return;
		}

		// Bulk Upsert perfume inventory
		const inventoryWithPerfumeId = inventory.map((item) => ({ ...item, perfume_id: perfumeId }));
		await supabase
			.from('perfume_inventory')
			.upsert(inventoryWithPerfumeId, { onConflict: 'perfume_id, volume, website' });
	}
}
