import { relations, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import {
	primaryKey,
	sqliteTable,
	text,
	integer,
	real,
	index,
	unique
} from 'drizzle-orm/sqlite-core';

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

export type Perfume = InferSelectModel<typeof perfumes> & {
	inventory?: Inventory[];
	notes?: PerfumeNote[];
};
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
		fragrantica_name: text('fragrantica_name'),
		gender: text('gender').notNull(),
		concentration: text('concentration').notNull()
	},
	(table) => [
		unique().on(table.name, table.house, table.gender, table.concentration),
		index('perfume_name_idx').on(table.name),
		index('perfume_house_idx').on(table.house)
	]
);

export type Note = InferSelectModel<typeof notes>;
export type PerfumeNote = InferSelectModel<typeof perfume_notes> & {
	note: Note;
};

export const perfume_notes = sqliteTable(
	'perfume_notes',
	{
		perfume_id: integer('perfume_id').references(() => perfumes.id),
		note_name: text('note_name').references(() => notes.name),
		note_type: text('note_type')
	},
	(t) => [primaryKey({ columns: [t.perfume_id, t.note_name] })]
);

export type Website = InferSelectModel<typeof websites>;

export const websites = sqliteTable('websites', {
	name: text('name').primaryKey(),
	address: text('address').notNull(),
	logo: text('logo').notNull()
});

export type Inventory = Omit<InferSelectModel<typeof inventory>, 'website'> & {
	website?: Website;
};

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

export const perfumeRelations = relations(perfumes, ({ many }) => ({
	notes: many(perfume_notes),
	inventory: many(inventory)
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
	perfume: one(perfumes, { fields: [inventory.perfume_id], references: [perfumes.id] }),
	website: one(websites, { fields: [inventory.website], references: [websites.name] })
}));

export const perfumeNoteRelations = relations(perfume_notes, ({ one }) => ({
	perfume: one(perfumes, {
		fields: [perfume_notes.perfume_id],
		references: [perfumes.id]
	}),
	note: one(notes, {
		fields: [perfume_notes.note_name],
		references: [notes.name]
	})
}));
