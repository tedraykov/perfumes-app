import { db } from './index'; // use your existing instance
import { seed } from 'drizzle-seed';
import { websites } from './schema';

async function run() {
	const sites = [
		{
			name: 'Fragrantica',
			address: 'https://www.fragrantica.com',
			logo: '/logos/fragrantica.png'
		},
		{
			name: 'Basenotes',
			address: 'https://www.basenotes.net',
			logo: '/logos/basenotes.png'
		},
		{
			name: 'Parfumo',
			address: 'https://www.parfumo.net',
			logo: '/logos/parfumo.png'
		}
	];

	await seed(db, { websites })
		.refine((f) => ({
			websites: {
				count: sites.length,
				columns: {
					name: f.valuesFromArray({ values: sites.map((s) => s.name) }),
					address: f.valuesFromArray({ values: sites.map((s) => s.address) }),
					logo: f.valuesFromArray({ values: sites.map((s) => s.logo) })
				}
			}
		}))
		.version(1);

	console.log('✅ Seeded websites');
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
