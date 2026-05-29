import {
	upsertPerfume,
	upsertUnprocessedDescription,
	upsertUprocessedPerfume,
	type UpsertPerfume
} from '$lib/server/db';
import { parseDescription } from '$lib/server/db/attributes-mapping';
import type { JobObserver } from '$lib/server/queue';
import * as cheerio from 'cheerio';
import logger from '$lib/server/logger';

export const WEBSITE_NAME = 'elinor';

const log = logger.child({ scraper: WEBSITE_NAME });

export class ElinorScraper {
	totalPages = 0;
	totalItemsCount = 0;
	allHouses: string[] = [];
	jobObserver: JobObserver;
	baseUrl = 'https://elinor.bg';

	constructor(jobObserver: JobObserver) {
		this.jobObserver = jobObserver;
	}

	async scrape() {
		await this.initJobData();

		log.info(`Fetching ${this.totalPages} pages`);
		for (let page = 1; page <= this.totalPages; page++) {
			this.jobObserver.updateProgress((page / this.totalPages) * 100);

			await this.getPerfumes(page);

			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	async initJobData() {
		const { totalPages, totalItemsCount, allHouses } = await this.getSearchInfo();
		this.totalItemsCount = totalItemsCount;
		this.totalPages = totalPages;
		this.allHouses = allHouses;

		await this.jobObserver.updateData({
			totalItemsCount: this.totalItemsCount,
			processedItemsCount: 0
		});
	}

	async getSearchInfo() {
		const data = await this.requestElinorPerfumes(1);
		const houseFilter = data.filter['1'];

		return {
			totalItemsCount: data.totalItemsCount,
			totalPages: Math.floor(data.totalItemsCount / 80),
			allHouses: houseFilter.options.map(({ label }: { label: string }) => label)
		};
	}

	async scrapeOne(url: string) {
		const perfumeData: UpsertPerfume = {
			inventory: [],
			website: WEBSITE_NAME
		};

		await this.extractPerfumeDetails(url, perfumeData);

		if (!perfumeData.perfume) {
			await upsertUprocessedPerfume({
				website: WEBSITE_NAME,
				perfume_url: url
			});
		} else {
			await upsertPerfume(perfumeData);
		}
	}

	async getPerfumes(page: number): Promise<UpsertPerfume[]> {
		const data = await this.requestElinorPerfumes(page);

		const $ = cheerio.load(data.listItems);
		const perfumes: UpsertPerfume[] = [];

		// Extract perfume details
		for (const product of $('.product-list-item')) {
			const element = $(product);
			const link = element.find('.product-list-item-link').attr('href');

			if (!link) {
				log.error({ name }, 'No link found for product');
				continue;
			}

			await this.scrapeOne(link);

			this.jobObserver.assertJobNotAborted();
			const jobData = await this.jobObserver.getLatestJobData();
			jobData['processedItemsCount'] += 1;
			this.jobObserver.updateData(jobData);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
		return perfumes;
	}

	async extractPerfumeDetails(url: string, perfumeData: UpsertPerfume) {
		const fullUrl = `${this.baseUrl}${url}`;
		const response = await fetch(fullUrl);
		log.info({ url: fullUrl }, 'Fetching perfume inventory');
		const html = await response.text();

		const $ = cheerio.load(html);

		const houseAndName = $('.top-section .title').text();
		const { house, name } = this.parseNameAndHouse(houseAndName);
		const description = $('.top-section .subtitle').text();
		const imagePath = $('.product-gallery-main-image').attr('src');
		const imageUrl = `${this.baseUrl}${imagePath}`;

		let attributes;
		try {
			attributes = await parseDescription(description, WEBSITE_NAME);
		} catch (error) {
			log.error({ err: error, description }, 'Could not parse attributes');
			await upsertUnprocessedDescription({
				website: WEBSITE_NAME,
				description
			});
			return;
		}

		if (!attributes) {
			log.error({ description }, 'Could not parse attributes');
			await upsertUnprocessedDescription({
				website: WEBSITE_NAME,
				description
			});
			return;
		}

		const { gender, concentration, is_tester, is_set } = attributes;

		if (is_set) return;

		perfumeData.perfume = {
			name,
			house,
			gender,
			concentration,
			image_url: imageUrl
		};

		$('.orderable-product').each((_, element) => {
			const volumeText = $(element).find('.volume').text().trim().replace('ml', '');
			const regularPrice =
				$(element).find('.regular-price').text().split('лв.').at(0)?.trim().replace('.', '') || 0;
			const promoPrice = $(element)
				.find('.promo-price')
				.text()
				.split('лв.')
				.at(0)
				?.trim()
				.replace('.', '');

			const volume = +volumeText;
			const bgnPrice = (promoPrice ? +promoPrice : +regularPrice) / 100;
			const price = bgnPrice / 1.95583;
			const available = $(element).find('.info-delivery-text').text().includes('Наличен');

			if (volume && price && available) {
				perfumeData.inventory.push({
					volume,
					price,
					website: WEBSITE_NAME,
					is_tester,
					url: fullUrl
				});
			}
		});
	}

	async requestElinorPerfumes(page: number = 1) {
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
	/**
	 * The full name of an elinor perfume starts with the house name followed by the perfume name
	 * separated by a space. This function extracts the house name and the perfume name from the full name
	 */
	parseNameAndHouse(nameAndHouse: string): { name: string; house: string } {
		const house = this.allHouses.find((house) => nameAndHouse.startsWith(house));
		if (!house) {
			log.error({ nameAndHouse }, 'No house found for perfume');
			return { name: nameAndHouse, house: '' };
		}
		const name = nameAndHouse.replace(house, '').trim();

		return { name, house };
	}
}
