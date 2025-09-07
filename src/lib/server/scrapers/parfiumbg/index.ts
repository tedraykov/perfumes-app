import {
	upsertPerfume,
	upsertUnprocessedDescription,
	upsertUprocessedPerfume,
	type UpsertPerfume
} from '$lib/server/db';
import { parseDescription } from '$lib/server/db/attributes-mapping';
import { type NewInventory, type NewPerfume } from '$lib/server/db/schema';
import type { JobObserver } from '$lib/server/queue';
import * as cheerio from 'cheerio';

const WEBSITE_NAME = 'parfiumbg';

export class ParfiumbgScraper {
	totalPages = 0;
	totalItemsCount = 0;
	jobObserver: JobObserver;

	constructor(jobObserver: JobObserver) {
		this.jobObserver = jobObserver;
	}

	async scrape() {
		try {
			await this.initJobData();

			for (let page = 1; page <= this.totalPages; page++) {
				console.log('Scraping page:', page);
				await this.jobObserver.updateProgress((page / this.totalPages) * 100);

				await this.getPerfumes(page);

				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch (error) {
			if ((error as Error).message == 'Job was aborted') {
				return;
			}
			console.error(error);
		}
	}

	async initJobData() {
		const { totalPages, totalItemsCount } = await this.getSearchInfo();
		this.totalItemsCount = totalItemsCount;
		this.totalPages = totalPages;
		console.log('Total pages:', this.totalPages);

		await this.jobObserver.updateData({
			totalItemsCount: this.totalItemsCount,
			processedItemsCount: 0
		});
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

	async getPerfumes(page: number) {
		const data = await this.requestPerfumes(page);
		const $ = cheerio.load(data['product_list_html']);

		for (const product of $('.js-product')) {
			const productElement = $(product);

			const detailsUrl = productElement.find('a.thumbnail').attr('href') || '';

			await this.scrapeOne(detailsUrl);

			await this.jobObserver.assertJobNotAborted();
			const jobData = await this.jobObserver.getLatestJobData();
			jobData['processedItemsCount'] += 1;
			await this.jobObserver.updateData(jobData);

			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	async getSearchInfo() {
		const data = await this.requestPerfumes();
		return {
			totalItemsCount: data.products_num,
			totalPages: Math.ceil(data.products_num / 20)
		};
	}

	async extractPerfumeDetails(url: string, data: UpsertPerfume) {
		try {
			// Fetch the HTML content of the page
			const response = await fetch(url);
			const html = await response.text();

			// Load the HTML into cheerio
			const $ = cheerio.load(html);

			const house = $('.product-name-manufacturer a').text().trim();
			const name = $('.product-name-middle').text().trim();
			const description = $('.product-name-type').text().trim();
			const image_url =
				$('.thumb.js-thumb.selected.js-thumb-selected').attr('data-image-medium-src') || '';

			let attributes;
			try {
				attributes = await parseDescription(description, WEBSITE_NAME);
			} catch (error) {
				console.error('Could not parse attributes for: ', description);
				console.error(error);
				await upsertUnprocessedDescription({
					website: WEBSITE_NAME,
					description
				});
				return;
			}

			if (!attributes) {
				console.error('Could not parse attributes for: ', description);
				await upsertUnprocessedDescription({
					website: WEBSITE_NAME,
					description
				});
				return;
			}

			const { is_tester, concentration } = attributes;

			let gender = $('.feature-group-11 .feature-value').text().trim();
			gender = this.normalizeGender(gender);

			const perfume: NewPerfume = {
				name,
				house,
				concentration,
				gender,
				image_url
			};

			data.perfume = perfume;

			const inventory: NewInventory[] = [];
			$('#group_1 .input-container').each((_, element) => {
				const availability = $(element).find('.variant-availability').text().trim();

				if (availability === 'Изчерпан') return;

				// Leave only the number from the volume
				const volume = $(element).find('.attr-name').text().trim().replace(/\D/g, '');
				const price = $(element)
					.find('.variant-price')
					.text()
					.split('лв.')[0]
					.trim()
					.replace(',', '');

				inventory.push({
					volume: +volume,
					price: +price / 100,
					website: WEBSITE_NAME,
					is_tester,
					url
				});
			});

			console.log(inventory);
			data.inventory = inventory;
		} catch (error) {
			console.error('Error scraping product:', (error as Error).message);
			return null;
		}
	}

	normalizeGender(gender: string): string {
		if (gender === 'Мъжки') {
			return 'men';
		}
		if (gender === 'Дамски') {
			return 'women';
		}
		if (gender === 'Унисекс') {
			return 'unisex';
		}
		console.error('Unknown gender');
		return 'unisex';
	}

	async requestPerfumes(page: number = 1) {
		const url = 'https://parfium.bg/module/amazzingfilter/ajax?ajax=1';

		const formData = new FormData();
		formData.append('action', 'getFilteredProducts');
		formData.append(
			'params',
			`page=${page}&` +
				'id_category=11&id_manufacturer=0&id_supplier=0&nb_items=20&controller_product_ids=&current_controller=category&page_name=category&orderBy=sales&orderWay=desc'
		);

		const response = await fetch(url, {
			method: 'POST',
			body: formData
		});

		// Use text() to get the response as plain text
		const data = await response.json();
		data['product_list_html'] = this.utf8_decode(data['product_list_html']);

		return data;
	}

	utf8_decode(utfstr: string) {
		var res = '';
		for (var i = 0; i < utfstr.length; ) {
			var c = utfstr.charCodeAt(i);
			if (c < 128) {
				res += String.fromCharCode(c);
				i++;
			} else if (c > 191 && c < 224) {
				var c1 = utfstr.charCodeAt(i + 1);
				res += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
				i += 2;
			} else {
				var c1 = utfstr.charCodeAt(i + 1);
				var c2 = utfstr.charCodeAt(i + 2);
				res += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
				i += 3;
			}
		}
		return res;
	}
}
