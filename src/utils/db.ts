import Dexie, { type Table } from 'dexie';
import type { FieldRecord } from '../types';

export class MycoHubDB extends Dexie {
  // Observations are stored locally first, then synced to Firestore
  observations!: Table<FieldRecord, string>;

  constructor() {
    super('MycoHubDB');
    this.version(1).stores({
      observations: 'id, userId, status, timestamp, collectionNumber'
    });
    this.version(2).stores({
      observations: 'id, userId, status, timestamp, collectionNumber, scientificName'
    });
  }
}

export const localDb = new MycoHubDB();
