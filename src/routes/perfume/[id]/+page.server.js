import { db } from '$lib/server/db';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  const perfume = await db.query.perfumes.findFirst({
    where: (perfumes, { eq }) => eq(perfumes.id, +params.id),
    with: {
      inventory: {
        with: {
          website: true
        }
      }
    }
  });

  return perfume;
}
