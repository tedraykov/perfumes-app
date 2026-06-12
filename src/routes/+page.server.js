import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { perfumes, websites } from '$lib/server/db/schema';
import { count, countDistinct } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const [{ total, housesCount }] = await db
		.select({ total: count(), housesCount: countDistinct(perfumes.house) })
		.from(perfumes);
	const [{ stores }] = await db.select({ stores: count() }).from(websites);

	return { total, housesCount, stores };
}

export const actions = {
	/**
	 * @type {import('@sveltejs/kit').Action}
	 */
	logout: async (event) => {
		redirect(301, '/signin');
	}
};
