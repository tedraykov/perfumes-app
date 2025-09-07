import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
	test: {
		environment: 'node', // use "jsdom" if you want DOM APIs for component tests
		include: ['src/**/*.{test,spec}.{js,ts}'],
		testTimeout: 10000
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
});
