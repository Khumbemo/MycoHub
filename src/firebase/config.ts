import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
