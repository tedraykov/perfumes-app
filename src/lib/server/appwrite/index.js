import { Client, Account, Databases, ID, Query } from 'node-appwrite';
import { APPWRITE_API_KEY } from '$env/static/private';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } from '$env/static/public';

export const SESSION_COOKIE = 'my-custom-session';
export const PERFUME_COLLECTION_ID = '674198bc002c97d29772';
export const DATABASE_ID = '674198b30019df7d6529';

/**
 * @typedef {import("./codegen").PerfumeEntusiastsPerfumeType} Perfume
 * @typedef {import("./").PerfumeSearchQuery} PerfumeSearchQuery
 * @typedef {import("./").PaginatedData<Perfume>} PaginatedPerfumes
 * @typedef {import("./").AddPerfumeWithInventoryInput} AddPerfumeWithInventoryInput
 * @typedef {import("node-appwrite").Models.Document} Document
 */
/**

/**
 * @param {Databases} databases
 * @param {Partial<Perfume>} input
 * @returns {Promise<string>} The ID of the created perfume
 */
async function addPerfume(databases, input) {
	const perfume = await databases.createDocument(
		DATABASE_ID,
		PERFUME_COLLECTION_ID,
		ID.unique(),
		input
	);

	return perfume.$id;
}

/**
 * @param {Databases} databases
 * @param {AddPerfumeWithInventoryInput} input
 */
async function addPerfumeWithInventory(databases, input) {
	const perfumeId = await addPerfume(databases, perfume);

	await databases.createDocument(DATABASE_ID, 'perfume_inventory', ID.unique(), {
		...inventory,
		perfume: perfumeId
	});
}

/**
 * @param {Databases} databases
 * @param {PerfumeSearchQuery} input
 * @returns {Promise<PaginatedPerfumes>}
 */
async function searchPerfumes(databases, input) {
	const queries = [];

	if (input.search) {
		queries.push(Query.search('name', input.search));
	}

	if (input.brand) {
		queries.push(Query.search('house', input.brand));
	}

	const { total, documents } = await databases.listDocuments(
		DATABASE_ID,
		PERFUME_COLLECTION_ID,
		queries
	);

	// @ts-ignore
	return { total, data: documents };
}

/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export function createSessionClient(event) {
	const client = new Client()
		.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
		.setProject(PUBLIC_APPWRITE_PROJECT_ID);

	const session = event.cookies.get(SESSION_COOKIE);
	if (!session) {
		throw new Error('No session');
	}

	client.setSession(session);
	const databases = new Databases(client);

	return {
		get account() {
			return new Account(client);
		},
		get databases() {
			return new Databases(client);
		},
		addPerfume: addPerfume.bind(null, databases),
		searchPerfumes: searchPerfumes.bind(null, databases)
	};
}

export function createAdminClient() {
	const client = new Client()
		.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
		.setProject(PUBLIC_APPWRITE_PROJECT_ID)
		.setKey(APPWRITE_API_KEY);

	const databases = new Databases(client);

	return {
		get account() {
			return new Account(client);
		},
		addPerfume: addPerfume.bind(null, databases)
	};
}
