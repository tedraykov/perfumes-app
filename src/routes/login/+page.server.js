import { SESSION_COOKIE, createAdminClient } from '$lib/server/appwrite/index.js';
import { redirect } from '@sveltejs/kit';

/**
 * @type {import('@sveltejs/kit').ServerLoad}
 */
export const load = ({ locals }) => {
  if (locals.user) throw redirect(301, '/');
};

export const actions = {
  /**
   * @type {import('@sveltejs/kit').Action}
   */
  default: async ({ request, cookies }) => {
    // Extract the form data.
    const form = await request.formData();

    const email = form.get('email');
    const password = form.get('password');

    // Create the Appwrite client.
    const { account } = createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    cookies.set(SESSION_COOKIE, session.secret, {
      sameSite: 'strict',
      expires: new Date(session.expire),
      secure: true,
      path: '/'
    });

    throw redirect(301, '/');
  }
};
