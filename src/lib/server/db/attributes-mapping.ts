import type { TextBlock } from '@anthropic-ai/sdk/resources';
import { db } from '.';
import { attributes_mapping, type AttributesMapping } from './schema';
import Anthropic from '@anthropic-ai/sdk';

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

	// Ask LLM to parse attributes
	const prompt = `You are an assistant that only outputs raw JSON.
Do not include code fences, markdown, explanations, or any extra text.
Output ONLY a single valid JSON object.

Parse the following perfume description into JSON with keys:
- concentration (one of: "EDT", "EDP", "Perfume", "EDC", "Extrait")
- gender ("unisex" | "men" | "women" – defaults to "unisex")
- is_tester (0|1 – perfumes without a cap or packaging are testers as well)
- is_set (0|1 – for example a set contains "комплект" in the name)

Description: "${description}"`;
	const msg = await anthropic.messages.create({
		model: 'claude-sonnet-4-0',
		max_tokens: 100,
		messages: [{ role: 'user', content: prompt }]
	});
	if (!msg.content[0]) {
		throw new Error('The AI Agent could not extract perfume attributes successfully');
	}
	const content = (msg.content[0] as TextBlock).text;
	console.log(`Description: ${description}, Website: ${website}`);
	console.log('Parsed by claude-sonnet-4-0: ');
	console.log(content);

	let parsed;
	try {
		parsed = JSON.parse(content);
	} catch (err) {
		throw new Error(`Failed to parse LLM output: ${content} `);
	}

	const record: AttributesMapping = {
		website,
		description,
		concentration: parsed.concentration,
		gender: parsed.gender,
		is_tester: parsed.is_tester,
		is_set: parsed.is_set
	};

	// Insert into DB and cache
	await db.insert(attributes_mapping).values(record).execute();
	attributesCache.set(key, record);

	return record;
}
