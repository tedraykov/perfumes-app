import { it } from 'vitest';
import { describe } from 'vitest';
import { ParfiumbgScraper } from '.';
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

describe('parfium.bg Scraper', () => {
	it('shoud scraper a single perfume', async () => {
		const scraper = new ParfiumbgScraper(mockObserver);
		const url =
			'https://parfium.bg/giorgio-armani-stronger-with-you-intensely-parfyum-za-maje-edp-100-ml';
		await scraper.scrapeOne(url);

		const expectedPerfumeData: UpsertPerfume = {
			perfume: {
				name: 'Stronger With You Intensely',
				house: 'Armani',
				gender: 'men',
				concentration: 'EDP',
				image_url:
					'https://parfium.bg/27993-medium_default/giorgio-armani-stronger-with-you-intensely-parfyum-za-maje-edp-100-ml.jpg'
			},
			inventory: [
				{
					volume: 50,
					price: 138.99,
					is_tester: 0,
					url,
					website: 'parfiumbg'
				},
				{
					volume: 100,
					price: 169.99,
					is_tester: 0,
					url,
					website: 'parfiumbg'
				},
				{
					volume: 150,
					price: 249.99,
					is_tester: 0,
					url,
					website: 'parfiumbg'
				}
			],
			website: 'parfiumbg'
		};

		expect(upsertPerfume).toHaveBeenCalledWith(expectedPerfumeData);
		expect(upsertUnprocessedDescription).not.toHaveBeenCalled();
	});
});
