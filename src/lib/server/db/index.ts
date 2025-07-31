import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { and, sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const client = createClient({ url: env.DATABASE_URL });

export const db = drizzle(client, { schema });

export type UpsertPerfume = {
  perfume?: schema.NewPerfume;
  inventory: schema.NewInventory[];
};

export async function upsertPerfume({ perfume, inventory }: UpsertPerfume) {
  if (!perfume) {
    throw new Error('perfume is missing');
  }

  // 1) Make sure the House exists (insert or do nothing)
  await db.insert(schema.houses).values({ name: perfume.house }).onConflictDoNothing().execute();

  console.log(perfume);
  // 2) Now upsert the Perfume, knowing the house is there
  const [upserted] = await db
    .insert(schema.perfumes)
    .values(perfume)
    .onConflictDoUpdate({
      target: [
        schema.perfumes.name,
        schema.perfumes.house,
        schema.perfumes.gender,
        schema.perfumes.concentration
      ],
      set: {
        image_url: perfume.image_url,
        fragrantica_url: perfume.fragrantica_url
      }
    })
    .returning({ id: schema.perfumes.id });
  if (!upserted?.id) {
    console.error('Upsert failed for perfume:', perfume);
    return;
  }
  const perfumeId = upserted.id;

  // 3) Cleanup inventory of matching perfume, then insert new ones
  const website = inventory[0].website;

  if (!website) {
    throw new Error('Could not infer the website when importing perfume');
  }

  await db
    .delete(schema.inventory)
    .where(and(eq(schema.inventory.website, website), eq(schema.inventory.perfume_id, perfumeId)));

  const newInventory = inventory.map((item) => ({
    ...item,
    perfume_id: perfumeId
  }));

  await db
    .insert(schema.inventory)
    .values(newInventory)
    .onConflictDoUpdate({
      target: [
        schema.inventory.perfume_id,
        schema.inventory.website,
        schema.inventory.volume,
        schema.inventory.is_tester
      ],
      set: {
        price: sql`excluded.price`,
        url: sql`excluded.url`
      }
    })
    .execute();
}
