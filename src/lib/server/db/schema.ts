import { relations, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index, unique } from 'drizzle-orm/sqlite-core';

export enum NoteType {
  Base = 'Base',
  Middle = 'Middle',
  Top = 'Top'
}
export enum Concentration {
  EDT = 'EDT',
  EDP = 'EDP',
  EDC = 'EDC',
  Perfume = 'Perfume',
  Extrait = 'Extrait',
  Oil = 'Oil'
}

// --- Tables ---
export const notes = sqliteTable('notes', {
  name: text('name').primaryKey(),
  image_url: text('image_url')
});

export const houses = sqliteTable('houses', {
  name: text('name').primaryKey(),
  image_url: text('image_url')
});

export type Perfume = InferSelectModel<typeof perfumes>;
export type NewPerfume = InferInsertModel<typeof perfumes>;

export const perfumes = sqliteTable(
  'perfumes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    house: text('house')
      .references(() => houses.name)
      .notNull(),
    image_url: text('image_url'),
    fragrantica_url: text('fragrantica_url'),
    gender: text('gender').notNull(),
    concentration: text('concentration').notNull()
  },
  (table) => [
    unique().on(table.name, table.house, table.gender, table.concentration),
    index('perfume_name_idx').on(table.name),
    index('perfume_house_idx').on(table.house)
  ]
);

export const perfume_notes = sqliteTable('perfume_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  perfume_id: integer('perfume_id').references(() => perfumes.id),
  note: text('note').references(() => notes.name),
  note_type: text('note_type')
});

export type Website = InferSelectModel<typeof websites>;
export const websites = sqliteTable('websites', {
  name: text('name').primaryKey(),
  address: text('address').notNull(),
  logo: text('logo').notNull()
});

export type Inventory = InferSelectModel<typeof inventory>;
export type NewInventory = InferInsertModel<typeof inventory>;
export const inventory = sqliteTable(
  'inventory',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    perfume_id: integer('perfume_id').references(() => perfumes.id),
    volume: integer('volume').notNull(),
    is_tester: integer('is_tester'),
    price: real('price').notNull(),
    website: text('website').references(() => websites.name),
    url: text('url')
  },
  (table) => [unique().on(table.perfume_id, table.volume, table.is_tester, table.website)]
);

export type PerfumeWithInventory = Perfume & {
  inventory: InventoryWithWebsite[];
};

export const perfumeRelations = relations(perfumes, ({ many }) => ({
  inventory: many(inventory)
}));

export type InventoryWithWebsite = Omit<Inventory, 'website'> & { website: Website };

export const inventoryRelations = relations(inventory, ({ one }) => ({
  perfume: one(perfumes, { fields: [inventory.perfume_id], references: [perfumes.id] }),
  website: one(websites, { fields: [inventory.website], references: [websites.name] })
}));
