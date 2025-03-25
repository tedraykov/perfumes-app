import { supabase } from '$lib/server/supabase/client';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const { data } = await supabase
		.from('perfumes')
		.select('*, perfume_inventory(*, websites(*))')
		.eq('id', +params.id)
		.single();

	return data;
}
