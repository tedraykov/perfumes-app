import { createSessionClient } from '$lib/server/appwrite';

/** @type {import('./$types').PageServerLoad} */
export async function load(event) {
  const { searchPerfumes } = createSessionClient(event);

  const { total, data } = await searchPerfumes({});

  return { perfumes: data, total };
}
