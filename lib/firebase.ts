import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
// Replace these with your actual Firebase credentials
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:dummy",
};

// Check if we're in a build environment with missing credentials
const isBuildTime = typeof window === "undefined" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Initialize Firebase only if it hasn't been initialized already
// During build time with missing credentials, we'll use dummy values
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.warn("Firebase initialization error (this is expected during build):", error);
  // Create a minimal app instance for build time
  app = getApps()[0] || initializeApp(firebaseConfig);
}

export const auth = getAuth(app);

// Set persistence to keep user logged in (browser local storage)
// This keeps the user logged in even after browser closes
if (typeof window !== "undefined" && !isBuildTime) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting persistence:", error);
  });
}

export const db = getFirestore(app);
export default app;
