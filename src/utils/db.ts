import Dexie, { type Table } from 'dexie';
import type { Observation } from '../types';

export class MycoHubDB extends Dexie {
  // We store observations locally before syncing to Firestore
  observations!: Table<Observation>;

  constructor() {
    super('MycoHubDB');
    this.version(1).stores({
      observations: 'id, userId, status, timestamp, collectionNumber'
    });
  }
}

export const localDb = new MycoHubDB();
