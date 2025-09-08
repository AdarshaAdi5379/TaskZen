import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// =================================================================================
// IMPORTANT: PLEASE FILL IN YOUR FIREBASE PROJECT CONFIGURATION HERE
// =================================================================================
// You can get this configuration object from your Firebase project console.
// Go to Project settings > General > Your apps > Firebase SDK snippet > Config.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // Replace with your actual API Key
  authDomain: "YOUR_AUTH_DOMAIN", // Replace with your actual Auth Domain
  projectId: "YOUR_PROJECT_ID", // Replace with your actual Project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your actual Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your actual Messaging Sender ID
  appId: "YOUR_APP_ID", // Replace with your actual App ID
};

// Initialize Firebase
let app: FirebaseApp;

// Check if all config values are filled
const isConfigValid = Object.values(firebaseConfig).every(value => !value.startsWith('YOUR_'));

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
