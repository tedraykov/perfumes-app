import { db } from '$lib/server/db';
import { perfumes } from '$lib/server/db/schema';
import { count, like } from 'drizzle-orm';
import { and } from 'drizzle-orm';
import { inArray } from 'drizzle-orm';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  const pageSize = 21;
  const page = url.searchParams.get('page') || '1';
  const searchQuery = url.searchParams.get('query') || '';
  const selectedHouses = url.searchParams.get('houses') || '';
  const selectedGender = url.searchParams.get('gender') || '';

  // Build our WHERE clauses dynamically
  const filters = [];
  if (searchQuery) {
    filters.push(like(perfumes.name, `%${searchQuery.toLowerCase()}%`));
  }
  if (selectedGender) {
    filters.push(inArray(perfumes.gender, selectedGender.split(',')));
  }
  const housesWhereClause = filters.length ? and(...filters) : undefined;

  if (selectedHouses) {
    filters.push(inArray(perfumes.house, selectedHouses.split(',')));
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  // 1) Count total matching rows
  const [{ total }] = await db
    .select({ total: count() })
    .from(perfumes)
    .where(whereClause)
    .execute();

  // 2) Fetch the page of perfumes + join inventory → websites
  const data = await db.query.perfumes.findMany({
    with: {
      inventory: {
        with: {
          website: true
        }
      }
    },
    where: (p, { like }) =>
      and(
        // Only include if there's a search term
        ...(searchQuery ? [like(p.name, `%${searchQuery.toLowerCase()}%`)] : []),
        // Only include if houses were selected
        ...(selectedHouses ? [inArray(perfumes.house, selectedHouses.split(','))] : []),
        // Only include if gender is selected
        ...(selectedGender ? [inArray(perfumes.gender, selectedGender.split(','))] : [])
      ),
    limit: pageSize,
    offset: (+page - 1) * pageSize
  });

  // 3) Get the distinct houses
  const houses = await db
    .select({ house: perfumes.house })
    .from(perfumes)
    .where(housesWhereClause)
    .groupBy(perfumes.house)
    .orderBy(perfumes.house)
    .execute();

  return {
    perfumes: data,
    total,
    houses: (houses || []).map(({ house }) => house),
    query: searchQuery,
    selectedHouses: (selectedHouses && selectedHouses.split(',')) || [],
    selectedGender: (selectedGender && selectedGender.split(',')) || [],
    page: +page
  };
}
