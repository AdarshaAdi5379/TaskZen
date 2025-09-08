import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// =================================================================================
// IMPORTANT: PLEASE FILL IN YOUR FIREBASE PROJECT CONFIGURATION HERE
// =================================================================================
// You can get this configuration object from your Firebase project console.
// Go to Project settings > General > Your apps > Firebase SDK snippet > Config.
const firebaseConfig = {
  projectId: "taskzen-4o5su",
  appId: "1:409036252128:web:3a73b3f4ea8af933398185",
  storageBucket: "taskzen-4o5su.appspot.com",
  apiKey: "AIzaSyAyPicSP2sLcAk3C5ESihJIoT1XdX6tNAI",
  authDomain: "taskzen-4o5su.firebaseapp.com",
  messagingSenderId: "409036252128",
};

// Initialize Firebase
let app: FirebaseApp;

// Check if all config values are filled
const isConfigValid = Object.values(firebaseConfig).every(value => !(value.startsWith('YOUR_') || value === ''));

if (isConfigValid) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
} else {
    console.error("Firebase configuration is incomplete. Please update src/lib/firebase.ts with your project credentials.");
}


// We use a function to get the services to ensure they are not accessed before the app is initialized.
const getFirebaseAuth = () => {
    if (!isConfigValid) {
        throw new Error("Firebase configuration is not valid. Cannot get Auth instance.");
    }
    return getAuth(app);
}

const getFirebaseDb = () => {
    if (!isConfigValid) {
        throw new Error("Firebase configuration is not valid. Cannot get Firestore instance.");
    }
    return getFirestore(app);
}

// Export a function to get the initialized app to avoid race conditions.
const getFirebaseApp = () => {
    if (!isConfigValid) {
        throw new Error("Firebase configuration is not valid.");
    }
    return app;
};


export { getFirebaseApp, getFirebaseAuth, getFirebaseDb };
