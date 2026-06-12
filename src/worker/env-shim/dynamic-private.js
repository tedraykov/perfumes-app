// Shim for SvelteKit's `$env/dynamic/private` when bundling the worker with
// plain Vite. `env` maps straight to process.env, so DATABASE_URL,
// DATABASE_AUTH_TOKEN, etc. resolve at runtime from the container environment.
export const env = process.env;
