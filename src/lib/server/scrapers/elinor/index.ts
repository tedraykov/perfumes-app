import { upsertPerfume, type UpsertPerfume } from '$lib/server/db';
import { parseDescription } from '$lib/server/db/attributes-mapping';
import type { NewInventory, NewPerfume } from '$lib/server/db/schema';
import type { Queue } from 'bullmq';
import type { Job } from 'bullmq';
import * as cheerio from 'cheerio';

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

async function getPerfumeInventory(url: string) {
	const fullUrl = `https://elinor.bg${url}`;
	const response = await fetch(fullUrl);
	console.log('Perfume inventory url:', fullUrl);
	const html = await response.text();

	const $ = cheerio.load(html);

	const products: NewInventory[] = [];

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
			products.push({ volume, price, website: 'elinor', is_tester: 0, url: fullUrl });
		}
	});
	await new Promise((resolve) => setTimeout(resolve, 200));
	return products;
}

export class ElinorScraper {
	totalPages = 0;
	totalItemsCount = 0;
	allHouses: string[] = [];
	job: Job<any, any, string>;
	queue: Queue;

	constructor(queue: Queue, job: Job) {
		this.queue = queue;
		this.job = job;
	}

	async scrape() {
		const { totalPages, totalItemsCount } = await this.getSearchInfo();
		this.totalItemsCount = totalItemsCount;
		this.totalPages = totalPages;
		this.initJobData();

		this.allHouses = await this.getAllHouses();

		await this.scrapeAllPerfumes();
	}

	async initJobData() {
		const initJobData = (await this.getLatestJobData()) || {};

		initJobData['totalItemsCount'] = this.totalItemsCount;
		initJobData['processedItemsCount'] = 0;
		await this.job.updateData(initJobData);
	}

	async getLatestJobData() {
		if (!this.job.id) {
			throw new Error('Job is missing');
		}
		const latestJob: Job = await this.queue.getJob(this.job.id);

		return latestJob.data;
	}

	async scrapeAllPerfumes() {
		for (let page = 1; page <= this.totalPages; page++) {
			this.job.updateProgress((page / this.totalPages) * 100);

			await this.getPerfumes(page);

			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	async getSearchInfo() {
		const data = await requestElinorPerfumes(1);

		return {
			totalItemsCount: data.totalItemsCount,
			totalPages: Math.floor(data.totalItemsCount / 80)
		};
	}

	async getAllHouses() {
		const data = await requestElinorPerfumes();
		const houseFilter = data.filter['1'];

		return houseFilter.options.map(({ label }: { label: string }) => label);
	}

	async getPerfumes(page: number): Promise<UpsertPerfume[]> {
		const data = await requestElinorPerfumes(page);

		const $ = cheerio.load(data.listItems);
		const perfumes: UpsertPerfume[] = [];

		// Extract perfume details
		for (const product of $('.product-list-item')) {
			const element = $(product);

			const nameAndHouse = element.find('.product-list-item-name').text().trim();
			const { name, house } = this.parseNameAndHouse(nameAndHouse);
			const description = element.find('.product-list-item-description').text().trim();

			let attributes;
			try {
				attributes = await parseDescription(description, 'elinor');
			} catch (error) {
				console.error('Could not parse attributes for: ', description);
				continue;
			}

			if (!attributes) {
				console.error('Could not parse attributes for: ', description);
				continue;
			}

			const { is_set, is_tester, concentration, gender } = attributes;

			// Ignore sets
			if (is_set) {
				continue;
			}

			const imageUrl = element.find('.product-list-item-image').attr('data-first-src') || null;
			const link = element.find('.product-list-item-link').attr('href');

			if (!link) {
				console.error('No link found for:', name);
				continue;
			}

			const inventory = await getPerfumeInventory(link);

			inventory.forEach((item) => (item.is_tester = is_tester));

			const perfume: NewPerfume = {
				name,
				image_url: `https://elinor.bg${imageUrl}`,
				house,
				concentration,
				gender
			};

			await upsertPerfume({ perfume, inventory });

			const jobData = (await this.getLatestJobData()) || {};
			if (jobData['aborted']) {
				throw new Error('This job was aborted');
			}
			jobData['processedItemsCount'] += 1;
			this.job.updateData(jobData);
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
}
