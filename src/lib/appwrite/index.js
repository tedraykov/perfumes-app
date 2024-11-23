import { Client, Account, ID } from 'appwrite';
import { PUBLIC_APPWRITE_PROJECT_ID, PUBLIC_APPWRITE_ENDPOINT } from '$env/static/public';
import { Databases } from 'appwrite';

export const client = new Client();

client.setEndpoint(PUBLIC_APPWRITE_ENDPOINT).setProject(PUBLIC_APPWRITE_PROJECT_ID);

export const PERFUME_COLLECTION_ID = '674198bc002c97d29772';
export const DATABASE_ID = '674198b30019df7d6529';

export const account = new Account(client);
export const databases = new Databases(client);

export { ID } from 'appwrite';

/**
 * @param {import("./types.ts").PerfumeEntusiastsPerfumeType} perfume
 */
export function addPerfume(perfume) {
  return databases.createDocument(DATABASE_ID, PERFUME_COLLECTION_ID, ID.unique(), perfume);
}
