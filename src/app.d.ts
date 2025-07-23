// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { MikroORM, EntityManager } from '@mikro-orm/core';
import type { LibSqlDriver } from '@mikro-orm/libsql';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			orm: MikroORM<IDatabaseDriver<unknown, LibSqlDriver>>;
			em: EntityManager<IDatabaseDriver<unknown, LibSqlDriver>>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
