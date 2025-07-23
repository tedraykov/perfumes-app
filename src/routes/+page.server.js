import { redirect } from '@sveltejs/kit';

export const actions = {
	/**
	 * @type {import('@sveltejs/kit').Action}
	 */
	logout: async (event) => {
		redirect(301, '/signin');
	}
};
