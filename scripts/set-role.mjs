#!/usr/bin/env node
// Assign a MycoHub role to a user by setting a Firebase Auth custom claim.
//
//   GOOGLE_APPLICATION_CREDENTIALS=service-account.json \
//     node scripts/set-role.mjs <uid-or-email> <COLLECTOR|IDENTIFIER|CURATOR|ADMIN>
//
// Get the service-account key from Firebase console → Project settings →
// Service accounts → Generate new private key. Keep it out of git.
// The user picks up the new role the next time their ID token refreshes
// (sign out and back in, or within an hour).
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const ROLES = ['COLLECTOR', 'IDENTIFIER', 'CURATOR', 'ADMIN'];
const [who, role] = process.argv.slice(2);

if (!who || !ROLES.includes(role)) {
  console.error(`Usage: node scripts/set-role.mjs <uid-or-email> <${ROLES.join('|')}>`);
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'mycohub-mutha';
initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId } : { credential: applicationDefault(), projectId });

const auth = getAuth();
const user = who.includes('@') ? await auth.getUserByEmail(who) : await auth.getUser(who);

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });
// Mirror the role on the profile for display; the claim is what rules trust.
await getFirestore().doc(`users/${user.uid}`).set({ role }, { merge: true });

console.log(`Set role ${role} for ${user.email ?? user.uid}`);
