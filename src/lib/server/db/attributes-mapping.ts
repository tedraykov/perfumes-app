import type { TextBlock } from '@anthropic-ai/sdk/resources';
import { db } from '.';
import { attributes_mapping, type AttributesMapping } from './schema';
import Anthropic from '@anthropic-ai/sdk';
import logger from '$lib/server/logger';

const log = logger.child({ module: 'attributes-mapping' });

// Initialize OpenAI client (ensure OPENAI_API_KEY is set)
const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY!
});

// In-memory cache
const attributesCache = new Map<string, AttributesMapping>();

// Load all mappings into cache at startup
export async function initAttributesCache() {
	const rows = await db.select().from(attributes_mapping).execute();
	for (const row of rows) {
		attributesCache.set(`${row.website}:${row.description}`, row);
	}
}

// Parse via LLM if not in cache
export async function parseDescription(
	description: string,
	website: string
): Promise<AttributesMapping | undefined> {
	const key = `${website}:${description}`;
	// Check cache
	const cached = attributesCache.get(key);
	if (cached) return cached;

	if (!description.trim()) return undefined;

	// Ask LLM to parse attributes
	const prompt = `You are an assistant that only outputs raw JSON.
Do not include code fences, markdown, explanations, or any extra text.
Output ONLY a single valid JSON object.

Parse the following perfume product description into JSON with these exact keys:
- is_fragrance: 0 or 1 — 0 if the product is NOT a wearable fragrance (e.g. hair mist, hair perfume, body lotion, candle, room spray, deodorant). If 0, all other fields can be null.
- concentration: one of "EDT" (Eau de Toilette), "EDP" (Eau de Parfum), "Perfume" (Parfum/Perfume), "EDC" (Eau de Cologne), "Extrait" (Extrait de Parfum), or "Oil". MUST NOT be null for fragrances — infer from context.
- gender: "unisex" | "men" | "women" — defaults to "unisex" if unclear
- is_tester: 0 or 1 — 1 if the product is a tester (no cap, no box, or explicitly labeled tester)
- is_set: 0 or 1 — 1 if the product is a gift set or bundle (e.g. contains "комплект", "set", "gift")

The description may be in Bulgarian. Examples:
- "Парфюм за мъже" → is_fragrance: 1, concentration: "Perfume", gender: "men"
- "Тоалетна вода за жени тестер" → is_fragrance: 1, concentration: "EDT", gender: "women", is_tester: 1
- "Eau de Parfum" → is_fragrance: 1, concentration: "EDP"
- "Hair Mist" → is_fragrance: 0
- "Парфюм за коса" → is_fragrance: 0

Description: "${description}"`;
	const msg = await anthropic.messages.create({
		model: 'claude-sonnet-4-5',
		max_tokens: 100,
		messages: [{ role: 'user', content: prompt }]
	});
	if (!msg.content[0]) {
		throw new Error('The AI Agent could not extract perfume attributes successfully');
	}
	const content = (msg.content[0] as TextBlock).text;
	log.info({ description, website, content }, 'Parsed by claude-sonnet-4-5');

	const json = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
	let parsed;
	try {
		parsed = JSON.parse(json);
	} catch (err) {
		throw new Error(`Failed to parse LLM output: ${content} `);
	}

	if (!parsed.is_fragrance) {
		log.info({ description }, 'Skipping non-fragrance');
		return undefined;
	}

	if (!parsed.concentration) {
		log.error({ description }, 'Missing concentration for description');
		return undefined;
	}

	const record: AttributesMapping = {
		website,
		description,
		concentration: parsed.concentration,
		gender: parsed.gender ?? 'unisex',
		is_tester: parsed.is_tester ?? 0,
		is_set: parsed.is_set ?? 0
	};

	// Insert into DB and cache
	await db.insert(attributes_mapping).values(record).onConflictDoNothing().execute();
	attributesCache.set(key, record);

	return record;
}
