/** @param {import('@sveltejs/kit').ServerLoadEvent} event */
export function load({ locals }) {
  const { user } = locals;

  return {
    user
  };
}
