import * as cheerio from 'cheerio';
import { execFile } from 'child_process';
import { promisify } from 'util';
import logger from '$lib/server/logger';

const execFileAsync = promisify(execFile);

const log = logger.child({ scraper: 'fragrantica' });

export type ScrapedNote = {
	name: string;
	image_url: string;
	// null when Fragrantica shows a flat ingredient list without top/middle/base breakdown
	note_type: 'top' | 'middle' | 'base' | null;
};

export type FragranticaPageData = {
	image_url: string | null;
	description: string | null;
	notes: ScrapedNote[];
};

function mapNoteTypeLabel(label: string): 'top' | 'middle' | 'base' | null {
	const l = label.toLowerCase();
	if (l.includes('top')) return 'top';
	if (l.includes('heart') || l.includes('middle')) return 'middle';
	if (l.includes('base')) return 'base';
	return null;
}

function noteNameAndSrc(
	$: cheerio.CheerioAPI,
	el: cheerio.AnyNode
): { name: string; src: string } | null {
	const img = $(el).find('img').first();
	const name =
		$(el).find('.pyramid-note-label').first().text().trim() ||
		img.attr('alt')?.trim() ||
		img.attr('title')?.trim();
	const src = img.attr('src');
	return name && src ? { name, src } : null;
}

function resolveImageUrl(src: string): string {
	return src.startsWith('http') ? src : `https://www.fragrantica.com${src}`;
}

// For each note link, walk up the DOM (max 6 levels) looking for a sibling or
// ancestor h3/h4 whose text maps to a note type. This handles Fragrantica's
// varying pyramid layouts (notes nested inside a section div, or sitting next
// to a header as siblings in a shared parent).
function assignNoteType(
	$: cheerio.CheerioAPI,
	el: cheerio.AnyNode
): 'top' | 'middle' | 'base' | null {
	let cursor = $(el).parent();
	for (let depth = 0; depth < 6 && cursor.length; depth++) {
		// Look for a heading inside this ancestor
		const innerHeader = cursor.find('h3, h4').first();
		if (innerHeader.length) {
			const t = mapNoteTypeLabel(innerHeader.text().trim());
			if (t) return t;
		}
		// Look for a heading that precedes this ancestor at the same level
		const prevHeader = cursor.prevAll('h3, h4').first();
		if (prevHeader.length) {
			const t = mapNoteTypeLabel(prevHeader.text().trim());
			if (t) return t;
		}
		cursor = cursor.parent();
	}
	return null;
}

export async function scrapeFragranticaPage(url: string): Promise<FragranticaPageData> {
	const result: FragranticaPageData = { image_url: null, description: null, notes: [] };

	// Node.js/undici's HTTP/2 fingerprint is flagged by Cloudflare on perfume
	// pages. curl uses a different TLS+HTTP/2 stack that passes the challenge.
	let html: string;
	try {
		const { stdout } = await execFileAsync('curl', [
			'-s',
			'--compressed',
			'-A',
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
			url
		], { maxBuffer: 10 * 1024 * 1024 }); // 10 MB — Fragrantica pages include large inline bundles
		if (!stdout) throw new Error('Empty response from curl');
		html = stdout;
	} catch (err) {
		log.error({ err, url }, 'Failed to fetch Fragrantica page');
		return result;
	}

	const $ = cheerio.load(html);

	const productEl = $('[itemtype="http://schema.org/Product"]');
	const imgEl = productEl.find('[itemprop="image"]').first();

	// Prefer the dark-background version served via <picture><source> siblings
	const pictureEl = imgEl.parent('picture');
	let resolvedImageUrl: string | null = null;
	if (pictureEl.length) {
		pictureEl.find('source').each((_i, src) => {
			if (resolvedImageUrl) return;
			const srcset = $(src).attr('srcset') ?? '';
			const firstSrc = srcset.split(',')[0].trim().split(' ')[0];
			if (firstSrc.includes('dark-')) resolvedImageUrl = firstSrc;
		});
	}

	if (!resolvedImageUrl) {
		const schemaImg = imgEl.attr('src') || imgEl.attr('content');
		resolvedImageUrl = schemaImg
			? schemaImg.startsWith('http')
				? schemaImg
				: `https://www.fragrantica.com${schemaImg}`
			: ($('meta[property="og:image"]').attr('content') ?? null);
	}
	result.image_url = resolvedImageUrl;

	const descEl = $('[itemprop="description"]');
	if (descEl.length) {
		const text = descEl.find('p').first().text().trim() || descEl.text().trim();
		result.description = text || null;
	}

	const pyramid = $('#pyramid');

	// Walk each note link and resolve its category by proximity to a section heading.
	pyramid.find('a.pyramid-note-link').each((_i, el) => {
		const parsed = noteNameAndSrc($, el);
		if (!parsed) return;
		const note_type = assignNoteType($, el);
		result.notes.push({
			name: parsed.name,
			image_url: resolveImageUrl(parsed.src),
			note_type
		});
	});

	// Deduplicate (same note can appear under multiple headings in some layouts)
	const seen = new Set<string>();
	result.notes = result.notes.filter((n) => {
		const key = `${n.note_type}:${n.name}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});

	log.info(
		{ url, noteCount: result.notes.length, hasDescription: !!result.description },
		'Scraped Fragrantica page'
	);
	return result;
}
