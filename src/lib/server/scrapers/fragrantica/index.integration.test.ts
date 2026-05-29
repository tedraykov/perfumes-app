import { describe, it, expect } from 'vitest';
import { scrapeFragranticaPage } from './scraper';
import type { ScrapedNote } from './scraper';

type TestCase = {
	url: string;
	label: string;
	expectedNotes: Pick<ScrapedNote, 'name' | 'note_type'>[];
	descriptionStartsWith: string;
};

const CASES: TestCase[] = [
	{
		url: 'https://www.fragrantica.com/perfume/Boucheron/Boucheron-Quatre-29443.html',
		label: 'Boucheron Quatre',
		descriptionStartsWith: 'Boucheron Quatre by Boucheron is a Floral Fruity fragrance',
		expectedNotes: [
			{ name: 'Grapefruit', note_type: 'top' },
			{ name: 'Tangerine', note_type: 'top' },
			{ name: 'Lemon', note_type: 'top' },
			{ name: 'Orange', note_type: 'top' },
			{ name: 'Jasmine', note_type: 'middle' },
			{ name: 'Apple', note_type: 'middle' },
			{ name: 'Big Strawberry', note_type: 'middle' },
			{ name: 'Rose', note_type: 'middle' },
			{ name: 'Peach', note_type: 'middle' },
			{ name: 'White Musk', note_type: 'base' },
			{ name: 'Cashmeran', note_type: 'base' },
			{ name: 'Cedar', note_type: 'base' },
			{ name: 'Vanilla', note_type: 'base' },
			{ name: 'Caramel', note_type: 'base' }
		]
	},
	{
		url: 'https://www.fragrantica.com/perfume/Jean-Paul-Gaultier/Le-Beau-Paradise-Garden-88836.html',
		label: 'Jean Paul Gaultier Le Beau Paradise Garden',
		descriptionStartsWith: 'Le Beau Paradise Garden by Jean Paul Gaultier is a fragrance for men',
		expectedNotes: [
			{ name: 'Green Notes', note_type: 'top' },
			{ name: 'Watery Notes', note_type: 'top' },
			{ name: 'Mint', note_type: 'top' },
			{ name: 'Ginger', note_type: 'top' },
			{ name: 'Coconut', note_type: 'middle' },
			{ name: 'Fig', note_type: 'middle' },
			{ name: 'Salt', note_type: 'middle' },
			{ name: 'Tonka Bean', note_type: 'base' },
			{ name: 'Sandalwood', note_type: 'base' }
		]
	}
];

describe('scrapeFragranticaPage', () => {
	for (const tc of CASES) {
		describe(tc.label, () => {
			it('returns a non-null image_url', async () => {
				const result = await scrapeFragranticaPage(tc.url);
				expect(result.image_url, 'image_url should be present').not.toBeNull();
				expect(result.image_url).toMatch(/^https?:\/\//);
			});

			it('returns the expected description', async () => {
				const result = await scrapeFragranticaPage(tc.url);
				expect(result.description, 'description should be present').not.toBeNull();
				expect(result.description).toContain(tc.descriptionStartsWith);
			});

			it('returns all expected notes with correct types', async () => {
				const result = await scrapeFragranticaPage(tc.url);

				const actual = result.notes.map((n) => ({ name: n.name, note_type: n.note_type }));

				for (const expected of tc.expectedNotes) {
					expect(
						actual,
						`note "${expected.name}" (${expected.note_type}) not found`
					).toContainEqual(expected);
				}

				expect(result.notes.length).toBe(tc.expectedNotes.length);
			});
		});
	}
});
