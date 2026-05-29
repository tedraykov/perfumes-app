import { describe, it, expect } from 'vitest';
import { getAlgoliaKey } from './api-key';

describe('Algolia key acquisition', () => {
	it(
		'getAlgoliaKey() returns a valid, non-expired key',
		async () => {
			const key = await getAlgoliaKey();

			expect(key, 'key should be a non-empty string').toBeTruthy();
			expect(typeof key).toBe('string');

			expect(key, 'key should look like base64').toMatch(/^[A-Za-z0-9+/]+=*$/);

			const decoded = Buffer.from(key, 'base64').toString('utf8');
			expect(decoded, 'decoded key should contain validUntil').toContain('validUntil=');

			const match = decoded.match(/validUntil=(\d+)/);
			expect(match, 'validUntil timestamp should be parseable').toBeTruthy();

			const validUntil = parseInt(match![1], 10);
			const nowSeconds = Date.now() / 1000;
			expect(
				validUntil,
				`key has expired (validUntil=${new Date(validUntil * 1000).toISOString()})`
			).toBeGreaterThan(nowSeconds);

			console.log(`Key valid until: ${new Date(validUntil * 1000).toISOString()}`);
		},
		{ timeout: 15000 }
	);

	it(
		'key works against the live Algolia search endpoint',
		async () => {
			const key = await getAlgoliaKey();

			const url = new URL('https://fgvi612dfz-dsn.algolia.net/1/indexes/*/queries');
			url.search = new URLSearchParams({
				'x-algolia-agent': 'Algolia for JavaScript (4.24.0); Browser (lite)',
				'x-algolia-api-key': key,
				'x-algolia-application-id': 'FGVI612DFZ'
			}).toString();

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Origin: 'https://www.fragrantica.com',
					Referer: 'https://www.fragrantica.com/'
				},
				body: JSON.stringify({
					requests: [
						{ indexName: 'fragrantica_perfumes', query: 'Sauvage Dior', params: 'hitsPerPage=1' }
					]
				})
			});

			const data = await response.json();
			expect(response.ok, `Algolia returned ${response.status}: ${JSON.stringify(data)}`).toBe(
				true
			);
			expect(
				data.results?.[0]?.hits?.length,
				'Should have at least one hit for "Sauvage Dior"'
			).toBeGreaterThan(0);

			const hit = data.results[0].hits[0];
			console.log(`Top hit: ${hit.naslov} by ${hit.dizajner}`);
		},
		{ timeout: 15000 }
	);
});
