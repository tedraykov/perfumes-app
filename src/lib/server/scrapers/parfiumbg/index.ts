import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Browser, Page } from 'playwright';
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
import logger from '$lib/server/logger';

const WEBSITE_NAME = 'parfiumbg';

const log = logger.child({ scraper: WEBSITE_NAME });
const CATEGORY_URL = 'https://parfium.bg/parfumi/';

export class ParfiumbgScraper {
	totalPages = 0;
	totalItemsCount = 0;
	jobObserver: JobObserver;
	browser: Browser | null = null;
	page: Page | null = null;

	constructor(jobObserver: JobObserver) {
		this.jobObserver = jobObserver;
	}

	async initBrowser() {
		await this.closeBrowser();
		chromium.use(StealthPlugin());
		this.browser = await chromium.launch({ headless: true });
		const context = await this.browser.newContext({
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
		});
		this.page = await context.newPage();

		await this.page.goto(CATEGORY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
		if ((await this.page.title()).includes('Just a moment')) {
			await this.page.waitForFunction(() => !document.title.includes('Just a moment'), {
				timeout: 25000
			});
		}
		await this.page.waitForSelector('.js-product', { timeout: 10000 });
		log.info('CF clearance obtained');
	}

	async closeBrowser() {
		await this.browser?.close();
		this.browser = null;
		this.page = null;
	}

	async scrape() {
		try {
			await this.initBrowser();
			await this.initJobData();

			for (let page = 1; page <= this.totalPages; page++) {
				log.info({ page }, 'Scraping page');
				await this.jobObserver.updateProgress((page / this.totalPages) * 100);
				await this.getPerfumes(page);
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
		} catch (error) {
			if ((error as Error).message === 'Job was aborted') return;
			log.error({ err: error });
		} finally {
			await this.closeBrowser();
		}
	}

	async initJobData() {
		const { totalPages, totalItemsCount } = await this.getSearchInfo();
		this.totalItemsCount = totalItemsCount;
		this.totalPages = totalPages;
		log.info({ totalPages: this.totalPages }, 'Total pages');

		await this.jobObserver.updateData({
			totalItemsCount: this.totalItemsCount,
			processedItemsCount: 0
		});
	}

	async withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				return await fn();
			} catch (err) {
				const isLast = attempt === retries;
				log.warn({ attempt, retries, err: (err as Error).message }, 'Attempt failed');
				if (isLast) throw err;
				// Re-navigate on page-level errors (broken context, CF re-trigger)
				if ((err as Error).message?.includes('Failed to fetch') || (err as Error).message?.includes('Execution context')) {
					log.info('Re-establishing CF clearance');
					await this.initBrowser();
				}
				await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
			}
		}
		throw new Error('unreachable');
	}

	async fetchListPage(pageNum: number) {
		const params = new URLSearchParams({
			id_category: '11',
			id_manufacturer: '0',
			id_supplier: '0',
			page: String(pageNum),
			nb_items: '20',
			controller_product_ids: '',
			current_controller: 'category',
			page_name: 'category',
			orderBy: 'sales',
			orderWay: 'desc',
			customer_groups: '1',
			count_data: '1'
		}).toString();

		return this.withRetry(() =>
			this.page!.evaluate(async (params: string) => {
				const res = await fetch('/module/amazzingfilter/ajax?ajax=1', {
					method: 'POST',
					body: new URLSearchParams({ action: 'getFilteredProducts', params })
				});
				return res.json();
			}, params)
		);
	}

	async fetchDetailPage(url: string): Promise<string> {
		return this.withRetry(() =>
			this.page!.evaluate(async (url: string) => {
				const res = await fetch(url);
				return res.text();
			}, url)
		);
	}

	async getSearchInfo() {
		const data = await this.fetchListPage(1);
		return {
			totalItemsCount: data.products_num as number,
			totalPages: Math.ceil(data.products_num / 20)
		};
	}

	async scrapeOne(url: string) {
		const ownsBrowser = !this.page;
		if (ownsBrowser) await this.initBrowser();

		try {
			const perfumeData: UpsertPerfume = { inventory: [], website: WEBSITE_NAME };
			await this.extractPerfumeDetails(url, perfumeData);

			if (!perfumeData.perfume) {
				await upsertUprocessedPerfume({ website: WEBSITE_NAME, perfume_url: url });
			} else {
				await upsertPerfume(perfumeData);
			}
		} finally {
			if (ownsBrowser) await this.closeBrowser();
		}
	}

	async getPerfumes(pageNum: number) {
		const data = await this.fetchListPage(pageNum);
		const $ = cheerio.load(data.product_list_html);

		for (const product of $('.js-product')) {
			const url = $(product).find('a.thumbnail').attr('href') || '';
			if (!url) continue;

			await this.scrapeOne(url);

			await this.jobObserver.assertJobNotAborted();
			const jobData = await this.jobObserver.getLatestJobData();
			jobData['processedItemsCount'] += 1;
			await this.jobObserver.updateData(jobData);

			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	async extractPerfumeDetails(url: string, data: UpsertPerfume) {
		try {
			const html = await this.fetchDetailPage(url);
			const $ = cheerio.load(html);

			const house = $('.product-name-manufacturer a').first().text().trim();
			const name = $('.product-name-middle').first().text().trim();
			const description = $('.product-name-type').first().text().trim();
			const image_url = $('.thumb.js-thumb').first().attr('data-image-medium-src') || '';

			let attributes;
			try {
				attributes = await parseDescription(description, WEBSITE_NAME);
			} catch (error) {
				log.error({ err: error, description }, 'Could not parse attributes');
				await upsertUnprocessedDescription({ website: WEBSITE_NAME, description });
				return;
			}

			if (!attributes) {
				await upsertUnprocessedDescription({ website: WEBSITE_NAME, description });
				return;
			}

			const { is_tester, concentration } = attributes;
			const gender = this.normalizeGender(
				$('.feature-group-11 .feature-value').first().text().trim()
			);

			const perfume: NewPerfume = { name, house, concentration, gender, image_url };
			data.perfume = perfume;

			const inventory: NewInventory[] = [];
			$('#group_1 .input-container').each((_, element) => {
				const availability = $(element).find('.variant-availability').text().trim();
				if (availability === 'Изчерпан') return;

				const volume = +$(element).find('.attr-name').text().trim().replace(/\D/g, '');
				// Price format: "25,50 € / 49.87 лв." — extract EUR value
				const priceText = $(element).find('.variant-price').text().trim();
				const eurPart = priceText.includes('/') ? priceText.split('/')[0] : priceText;
				const price = parseFloat(eurPart.replace('€', '').trim().replace(',', '.'));

				if (volume && price) {
					inventory.push({ volume, price, website: WEBSITE_NAME, is_tester, url });
				}
			});

			data.inventory = inventory;
		} catch (error) {
			log.error({ err: error }, 'Error scraping product');
		}
	}

	normalizeGender(gender: string): string {
		if (gender === 'Мъжки') return 'men';
		if (gender === 'Дамски') return 'women';
		if (gender === 'Унисекс') return 'unisex';
		log.error({ gender }, 'Unknown gender value');
		return 'unisex';
	}
}
