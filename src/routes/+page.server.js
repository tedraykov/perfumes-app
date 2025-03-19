import { createSessionClient, SESSION_COOKIE } from '$lib/server/appwrite';
import { redirect } from '@sveltejs/kit';

export const actions = {
  /**
   * @type {import('@sveltejs/kit').Action}
   */
  logout: async (event) => {
    const { account } = createSessionClient(event);

    await account.deleteSession('current');
    event.cookies.delete(SESSION_COOKIE, { path: '/' });

    redirect(301, '/signin');
  }
};
