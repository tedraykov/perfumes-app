import { it } from 'vitest';
import { describe } from 'vitest';
import { ElinorScraper, WEBSITE_NAME } from '.';
import { vi } from 'vitest';
import { mockObserver } from '$lib/server/queue/mock';
import { expect } from 'vitest';
import { upsertPerfume, upsertUnprocessedDescription, type UpsertPerfume } from '$lib/server/db';

vi.mock('$lib/server/db', () => {
	return {
		upsertPerfume: vi.fn(),
		upsertUnprocessedDescription: vi.fn(),
		upsertUprocessedPerfume: vi.fn(),
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					execute: vi.fn().mockResolvedValue([])
				}))
			})),
			insert: vi.fn(() => ({
				values: vi.fn(() => ({
					execute: vi.fn().mockResolvedValue(undefined)
				}))
			}))
		}
	};
});

describe('Elinor Scraper', () => {
	it('shoud scraper a single perfume', async () => {
		const scraper = new ElinorScraper(mockObserver);
		const path = '/product/giorgio-armani-emporio-stronger-with-you';
		const url = `https://elinor.bg${path}`;
		await scraper.initJobData();
		await scraper.scrapeOne(path);

		const expectedPerfumeData: UpsertPerfume = {
			perfume: {
				name: 'Emporio Stronger With You',
				house: 'Giorgio Armani',
				gender: 'men',
				concentration: 'EDT',
				image_url: 'https://elinor.bg/uploads/productgalleryfile/images/360x360/3605522040588.jpg'
			},
			inventory: [
				{
					volume: 100,
					price: 182,
					is_tester: 0,
					url,
					website: WEBSITE_NAME
				},
				{
					volume: 30,
					price: 119,
					is_tester: 0,
					url,
					website: WEBSITE_NAME
				},
				{
					volume: 50,
					price: 125,
					is_tester: 0,
					url,
					website: WEBSITE_NAME
				}
			],
			website: WEBSITE_NAME
		};

		expect(upsertPerfume).toHaveBeenCalledWith(expectedPerfumeData);
		expect(upsertUnprocessedDescription).not.toHaveBeenCalled();
	});
});
