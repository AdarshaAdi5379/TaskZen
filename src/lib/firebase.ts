import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hard-coded Firebase configuration to ensure it's always available.
const firebaseConfig = {
  apiKey: "AIzaSyAyPicSP2sLcAk3C5ESihJIoT1XdX6tNAI",
  authDomain: "taskzen-4o5su.firebaseapp.com",
  projectId: "taskzen-4o5su",
  storageBucket: "taskzen-4o5su.firebasestorage.app",
  messagingSenderId: "409036252128",
  appId: "1:409036252128:web:3a73b3f4ea8af933398185",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
