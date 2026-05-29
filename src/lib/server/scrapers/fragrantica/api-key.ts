import fs from 'fs/promises';
import path from 'path';
import logger from '$lib/server/logger';

const log = logger.child({ module: 'fragrantica-api-key' });
const KEY_FILE = path.join(process.cwd(), '.algolia-key.json');
// Refresh when less than 24 h remain
const REFRESH_BUFFER_S = 24 * 60 * 60;

type StoredKey = { key: string; validUntil: number };

let cached: StoredKey | null = null;
let refreshing: Promise<StoredKey> | null = null;

function secondsUntilExpiry(stored: StoredKey): number {
	return stored.validUntil - Date.now() / 1000;
}

function isUsable(stored: StoredKey): boolean {
	return secondsUntilExpiry(stored) > REFRESH_BUFFER_S;
}

function parseExpiry(key: string): number | null {
	try {
		const decoded = Buffer.from(key, 'base64').toString('utf8');
		const m = decoded.match(/validUntil=(\d+)/);
		return m ? parseInt(m[1], 10) : null;
	} catch {
		return null;
	}
}

async function loadFromDisk(): Promise<StoredKey | null> {
	try {
		return JSON.parse(await fs.readFile(KEY_FILE, 'utf8'));
	} catch {
		return null;
	}
}

async function saveToDisk(stored: StoredKey): Promise<void> {
	await fs.writeFile(KEY_FILE, JSON.stringify(stored), 'utf8');
}

async function fetchFromFragrantica(): Promise<StoredKey> {
	log.info('Fetching fresh Algolia key from Fragrantica HTML');

	const res = await fetch('https://www.fragrantica.com/', {
		headers: {
			'User-Agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
			Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'Accept-Language': 'en-US,en;q=0.9'
		}
	});

	if (!res.ok) throw new Error(`Fragrantica responded with ${res.status}`);

	const html = await res.text();

	const match = html.match(/toAbby\s*=\s*"([A-Za-z0-9+/]+=*)"/);
	if (!match) throw new Error('toAbby variable not found in Fragrantica HTML');

	const key = match[1];
	const validUntil = parseExpiry(key);
	if (!validUntil) throw new Error('Could not parse validUntil from Algolia key');

	log.info({ validUntil: new Date(validUntil * 1000).toISOString() }, 'Captured fresh Algolia key');
	return { key, validUntil };
}

export async function getAlgoliaKey(): Promise<string> {
	// 1. In-memory cache
	if (cached && isUsable(cached)) return cached.key;

	// 2. Disk cache
	const disk = await loadFromDisk();
	if (disk && isUsable(disk)) {
		cached = disk;
		return disk.key;
	}

	// 3. Fetch fresh — deduplicate concurrent callers
	if (!refreshing) {
		refreshing = fetchFromFragrantica()
			.then(async (stored) => {
				cached = stored;
				await saveToDisk(stored);
				return stored;
			})
			.finally(() => {
				refreshing = null;
			});
	}

	return (await refreshing).key;
}
