import { createSessionClient } from '$lib/server/appwrite';

/**
 * @param {Parameters<import('@sveltejs/kit').Handle>[0]} input
 */
export async function handle({ event, resolve }) {
  try {
    const { account } = createSessionClient(event);
    event.locals.user = await account.get();
  } catch { }

  return resolve(event);
}
