import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	build: {
		ssr: true,
		target: 'node22',
		rollupOptions: {
			input: path.resolve('./src/worker/index.ts'),
			output: {
				dir: 'build',
				entryFileNames: 'worker.js',
				format: 'esm'
			},
			// Externalize real npm packages (bundle only our own source + the
			// `$lib` / `$env` aliases below). Anything not starting with `.`, `/`
			// or `$` is a bare package specifier resolved from node_modules at runtime.
			external: (id) => !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('$')
		},
		emptyOutDir: false
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			// SvelteKit's `$env/dynamic/private` virtual module isn't available
			// without the SvelteKit plugin — point it at a shim that reads from
			// process.env at runtime.
			'$env/dynamic/private': path.resolve('./src/worker/env-shim/dynamic-private.js')
		}
	}
});
