// MycoHub Cloud Functions. Deploy with `npm run deploy:functions`
// (requires the Firebase Blaze plan).
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { computeConsensus } from './consensus.js';

initializeApp();

/**
 * Recompute an observation's status and consensus taxon whenever someone adds,
 * changes or removes an identification. Clients can't write these fields, so
 * the server is the authority. A FLAGGED record keeps its flag until a person
 * clears it.
 */
export const onIdentificationWrite = onDocumentWritten(
  'observations/{obsId}/identifications/{uid}',
  async (event) => {
    const db = getFirestore();
    const obsRef = db.doc(`observations/${event.params.obsId}`);
    const obsSnap = await obsRef.get();
    if (!obsSnap.exists) return;
    const obs = obsSnap.data();
    if (obs.status === 'FLAGGED') return;

    const idsSnap = await obsRef.collection('identifications').get();
    let ownerRole = 'COLLECTOR';
    try {
      ownerRole = (await getAuth().getUser(obs.userId)).customClaims?.role ?? 'COLLECTOR';
    } catch {
      // Owner account deleted: treat as a collector.
    }

    const result = computeConsensus({
      ownerId: obs.userId,
      ownerRole,
      ownerTaxon: obs.scientificName,
      hasDate: typeof obs.timestamp === 'string' && obs.timestamp.length > 0,
      hasCoordinates: typeof obs.latitude === 'number' && typeof obs.longitude === 'number',
      identifications: idsSnap.docs.map((d) => d.data()),
    });

    if (obs.status !== result.status || obs.consensusTaxon !== result.taxon) {
      await obsRef.update({
        status: result.status,
        consensusTaxon: result.taxon,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  },
);
