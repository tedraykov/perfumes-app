import { supabase } from '$lib/server/supabase/client';

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  const page = url.searchParams.get('page') || '1';
  const searchQuery = url.searchParams.get('query') || '';
  const selectedHouses = url.searchParams.get('houses') || '';
  const selectedGender = url.searchParams.get('gender') || '';

  const query = supabase
    .from('perfumes')
    .select('*, perfume_inventory(*, websites(*))', { count: 'exact' });

  if (url.searchParams.has('query')) {
    query.ilike('name', `%${url.searchParams.get('query')}%`);
  }

  if (selectedHouses) {
    query.in('house', selectedHouses.split(','));
  }

  if (selectedGender) {
    query.in('gender', selectedGender.split(','));
  }

  // There should be 21 items per page
  // Limit the query result by starting at an offset from and ending at the offset to. Only records within this range are returned. This respects the query order and if there is no order clause the range could behave unexpectedly. The from and to values are 0-based and inclusive: range(1, 3) will include the second, third and fourth rows of the query.
  const { data, count } = await query.range((+page - 1) * 21, +page * 21 - 1);
  const { data: houses } = await supabase.rpc('get_distinct_houses', {
    search_query: searchQuery
  });

  return {
    perfumes: data,
    total: count,
    houses: (houses || []).map(({ house }) => house),
    query: searchQuery,
    selectedHouses: (selectedHouses && selectedHouses.split(',')) || [],
    selectedGender: (selectedGender && selectedGender.split(',')) || [],
    page: +page
  };
}
