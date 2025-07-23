/**
 * @param {Parameters<import('@sveltejs/kit').Handle>[0]} input
 */
export async function handle({ event, resolve }) {
	return resolve(event);
}
