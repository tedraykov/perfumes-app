import type { Models } from 'node-appwrite';

export type Email = `${string}@${string}.${string}`;

export type URL = `${string}://${string}.${string}`;

export enum PerfumeEntusiastsPerfumeTypeConcentration {
  'EDT' = 'EDT',
  'EDP' = 'EDP',
  'EDC' = 'EDC',
  'Perfume' = 'Perfume',
  'Extrait' = 'Extrait',
  'Oil' = 'Oil'
}

export interface PerfumeEntusiastsPerfumeType {
  name: string;
  house: string;
  notes?: PerfumeEntusiastsNoteType[];
  top_notes?: string[];
  middle_notes?: string[];
  base_notes?: string[];
  ungrouped_notes?: string[];
  image?: URL;
  fragrantica_url?: URL;
  gender?: string;
  concentration?: PerfumeEntusiastsPerfumeTypeConcentration;
}

export interface PerfumeEntusiastsPerfumeDocument
  extends PerfumeEntusiastsPerfumeType,
  Models.Document {
  notes: PerfumeEntusiastsNoteDocument[];
}

export interface PerfumeEntusiastsNoteType {
  name: string;
  image: URL;
}

export interface PerfumeEntusiastsNoteDocument extends PerfumeEntusiastsNoteType, Models.Document { }

export interface PerfumeEntusiastsWebsiteType {
  name: string;
  address: URL;
  logo: URL;
}

export interface PerfumeEntusiastsWebsiteDocument
  extends PerfumeEntusiastsWebsiteType,
  Models.Document { }

export interface PerfumeEntusiastsPerfumeInventoryType {
  perfume?: PerfumeEntusiastsPerfumeType;
  website?: PerfumeEntusiastsWebsiteType;
  is_tester: boolean;
  volume: number;
  price: number;
}

export interface PerfumeEntusiastsPerfumeInventoryDocument
  extends PerfumeEntusiastsPerfumeInventoryType,
  Models.Document {
  perfume: PerfumeEntusiastsPerfumeDocument;
  website: PerfumeEntusiastsWebsiteDocument;
}
