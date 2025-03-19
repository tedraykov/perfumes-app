import * as cheerio from 'cheerio';

/**
 * @typedef {import('$lib/server/appwrite/codegen').PerfumeEntusiastsPerfumeType} Perfume
 * @typedef {import('$lib/server/appwrite/codegen').PerfumeEntusiastsPerfumeInventoryType} PerfumeInventory
 **/

/** @type {any} */
const descriptionAttributes = {
	'Парфюм EDP Тестер за мъже': { concentration: 'EDP', tester: true, gender: 'men' },
	'Парфюм EDP за жени': { concentration: 'EDP', gender: 'women' },
	'Комплект с Парфюм EDP за жени': { concentration: 'EDP', gender: 'women', set: true },
	'Парфюм EDP за мъже': { concentration: 'EDP', gender: 'men' },
	'Парфюм EDT Тестер за мъже': { concentration: 'EDT', tester: true, gender: 'men' },
	'Парфюм EDT': { concentration: 'EDT' },
	'Парфюм EDP': { concentration: 'EDP' },
	'EDC Тестер': { concentration: 'EDC', tester: true },
	'EDC Тестер за жени': { concentration: 'EDC', tester: true, gender: 'women' },
	'Парфюм EDT за мъже': { concentration: 'EDT', gender: 'men' },
	'Парфюм EDT за жени': { concentration: 'EDT', gender: 'women' },
	'Комплект с Парфюм EDP за мъже': { concentration: 'EDP', gender: 'men', set: true },
	'Парфюм EDP Тестер за жени': { concentration: 'EDP', tester: true, gender: 'women' },
	'Комплект с Парфюм EDT за жени': { concentration: 'EDT', gender: 'women', set: true },
	'Комплект с Парфюм EDT за мъже': { concentration: 'EDT', gender: 'men', set: true },
	'Perfumed Oil': { concentration: 'Oil' },
	'Extrait de Parfum': { concentration: 'Extrait' },
	'Парфюм EDP Тестер': { concentration: 'EDP', tester: true },
	'Парфюм EDT Тестер за жени': { concentration: 'EDT', tester: true, gender: 'women' },
	'Extrait de Parfum Тестер': { concentration: 'Extrait', tester: true },
	'Parfem за жени': { concentration: 'Perfume', gender: 'women' },
	'Комплект с Парфюм EDT': { concentration: 'EDT', set: true },
	'Одеколон за мъже': { concentration: 'EDC', gender: 'men' },
	'Комплект с Parfem': { concentration: 'Perfume', set: true },
	'Perfume Extract': { concentration: 'Perfume' },
	'Парфюм EDT Тестер': { concentration: 'EDT', tester: true },
	'Комплект с Parfem за мъже': { concentration: 'Perfume', gender: 'men', set: true },
	'Parfem за мъже': { concentration: 'Perfume', gender: 'men' },
	'EDC за мъже': { concentration: 'EDC', gender: 'men' },
	Parfem: { concentration: 'Perfume' },
	'Афтършейв за мъже': { gender: 'men' }
};

/**
 * @param {string} description
 */
function parseDescription(description) {
	const attributes = descriptionAttributes[description];
	if (!attributes) {
		console.error('Unknown description:', description);
		return {};
	}

	return attributes;
}

/**
 * @param {string} url
 **/
async function getPerfumeDetails(url) {
	const response = await fetch(url);
	const html = await response.text();

	const $ = cheerio.load(html);

	/** @type {Partial<PerfumeInventory>[]} */
	const products = [];

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
			products.push({ volume, price });
		}
	});
}

/**
 * @param {number} page - current page number to fetch
 */
async function getPerfumes(page) {
	const url = 'https://elinor.bg/product-list?skipOrderInit=1&skipCountryInit=1';

	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			productCategoryId: 56,
			'filterParams[minPrice]': 0,
			'filterParams[maxPrice]': 1370,
			orderBy: 'id-desc',
			perPage: 80,
			page: page
		})
	});

	const data = await response.json();

	const $ = cheerio.load(data.listItems);

	// Extract perfume details
	const perfumes = $('.product-list-item')
		.map((_, el) => {
			const element = $(el);

			const name = element.find('.product-list-item-name').text().trim();
			const description = element.find('.product-list-item-description').text().trim();
			const defaultPrice = element.find('.price').text().trim();
			const promoPrice = element.find('.promo-price').text().trim();
			const { gender, concentration, set } = parseDescription(description);

			if (set) return null;

			const image = element.find('.product-list-item-image').attr('src');
			const link = element.find('.product-list-item-link').attr('href');

			const price = parseFloat((promoPrice || defaultPrice).replace('лв.', '').replace(',', '.'));

			const inventory = getPerfumeDetails(`https://elinor.bg${link}`);

			/** @type {Perfume} */
			const perfume = {
				name,
				image,
				link
			};
			if (gender) {
				perfume.gender = gender;
			}

			if (concentration) {
				perfume.concentration = concentration;
			}

			return {
				perfume,
				inventory
			};
		})
		.get();

	return perfumes.filter(Boolean);
}

async function getTotalPages() {
	const response = await fetch('https://elinor.bg/products/parfumi');
	const html = await response.text();

	const $ = cheerio.load(html);

	const pageNumbers = $('.paging-page[data-page]')
		.map((_, el) => parseInt($(el).attr('data-page'), 10))
		.get();

	// Get the maximum page number
	const totalPages = Math.max(...pageNumbers);

	console.log('Total number of pages:', totalPages);
	return totalPages;
}

/**
 * @param {Function} [processor]
 */
async function getAllPerfumes(processor) {
	// const totalPages = await getTotalPages();
	const totalPages = 5;

	for (let page = 1; page <= totalPages; page++) {
		const perfumes = await getPerfumes(page);
		console.log('Page:', page);
		processor && processor(perfumes);
	}
}

await getAllPerfumes();
