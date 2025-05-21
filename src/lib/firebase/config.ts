
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// Removed: import { getFirestore } from "firebase/firestore"; // We'll use Supabase for database
import { getAuth } from "firebase/auth"; 

// TODO: Add your own Firebase configuration from your Firebase project settings
// This is still needed if you are using Firebase Auth for the admin login.
// If you plan to migrate Auth to Supabase as well, this file might be removed later.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID" // Optional, for Google Analytics
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// const db = getFirestore(app); // Firestore DB instance removed
const auth = getAuth(app); // Initialize and export auth

export { app, auth }; // db is no longer exported
