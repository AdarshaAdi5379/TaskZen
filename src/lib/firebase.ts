import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyPicSP2sLcAk3C5ESihJIoT1XdX6tNAI",
  authDomain: "taskzen-4o5su.firebaseapp.com",
  projectId: "taskzen-4o5su",
  storageBucket: "taskzen-4o5su.firebasestorage.app",
  messagingSenderId: "409036252128",
  appId: "1:409036252128:web:3a73b3f4ea8af933398185",
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
