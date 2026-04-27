import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIQVXIt5gJFun2Eb4YYQP-U8hMCG0UCUw",
  authDomain: "mycohub-mutha.firebaseapp.com",
  projectId: "mycohub-mutha",
  storageBucket: "mycohub-mutha.firebasestorage.app",
  messagingSenderId: "148895400211",
  appId: "1:148895400211:android:d2b7e6ba250c4847515ae6"
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
