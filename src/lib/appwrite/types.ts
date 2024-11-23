import type { Models } from 'node-appwrite';

export type Email = `${string}@${string}.${string}`;

export type URL = `${string}://${string}.${string}`;

export interface PerfumeEntusiastsPerfumeType {
    name: string;
    house: string;
    notes?: PerfumeEntusiastsNoteType[];
    top_notes?: string[];
    middle_notes?: string[];
    base_notes?: string[];
    ungrouped_notes?: string[];
}

export interface PerfumeEntusiastsPerfumeDocument extends PerfumeEntusiastsPerfumeType, Models.Document {
    notes: PerfumeEntusiastsNoteDocument[];
}

export interface PerfumeEntusiastsNoteType {
    name: string;
    image: URL;
}

export interface PerfumeEntusiastsNoteDocument extends PerfumeEntusiastsNoteType, Models.Document {
}

export interface PerfumeEntusiastsWebsiteType {
    name: string;
    address: URL;
    logo: URL;
}

export interface PerfumeEntusiastsWebsiteDocument extends PerfumeEntusiastsWebsiteType, Models.Document {
}

