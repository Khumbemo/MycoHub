import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const env = import.meta.env;

// Values come from .env (see .env.example). The fallbacks are the project's
// existing public client config; Firebase web config is not secret, access is
// controlled by firestore.rules and storage.rules.
// Note: the fallback appId is the Android app's. Register a Web app in the
// Firebase console and set VITE_FIREBASE_APP_ID to its ID for web builds.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDIQVXIt5gJFun2Eb4YYQP-U8hMCG0UCUw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "mycohub-mutha.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "mycohub-mutha",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "mycohub-mutha.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "148895400211",
  appId: env.VITE_FIREBASE_APP_ID || "1:148895400211:android:d2b7e6ba250c4847515ae6",
};

// Safe initialization to prevent crashes on bad networks
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase init failed, running in offline mode:", error);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

// `VITE_USE_EMULATORS=true npm run dev` talks to `npm run emulators` instead of production.
if (env.VITE_USE_EMULATORS === "true" && auth && db && storage) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
