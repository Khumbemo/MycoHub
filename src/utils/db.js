import Dexie from 'dexie';

export class MycoHubDB extends Dexie {
  // Observations are stored locally first, then synced to Firestore

  constructor() {
    super('MycoHubDB');
    this.version(1).stores({
      observations: 'id, userId, status, timestamp, collectionNumber',
    });
    this.version(2).stores({
      observations: 'id, userId, status, timestamp, collectionNumber, scientificName',
    });
    this.version(3)
      .stores({
        observations: 'id, userId, status, timestamp, collectionNumber, scientificName, remoteId, nextSyncAt',
        deletions: 'remoteId',
      })
      .upgrade((tx) =>
        // Fill in fields added with the sync engine and science features.
        tx
          .table('observations')
          .toCollection()
          .modify((r) => {
            r.coordinateUncertaintyInMeters ??= null;
            r.identifications ??= [];
            r.sporePrintColor ??= '';
            r.sporeMeasurements ??= '';
            r.melzers ??= 'NOT_TESTED';
            r.clampConnections ??= 'NOT_SEEN';
            r.updatedAt ??= r.timestamp ?? new Date().toISOString();
            r.dirty ??= false;
            r.statusDirty ??= false;
            r.syncAttempts ??= 0;
            r.nextSyncAt ??= 0;
          }),
      );
  }
}

export const localDb = new MycoHubDB();
