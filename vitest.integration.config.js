import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
	test: {
		name: 'integration',
		environment: 'node',
		include: ['src/**/*.integration.test.{js,ts}'],
		testTimeout: 120000
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
});
