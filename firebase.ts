// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJz-CxGvgB2dXRkhTJaFHqDJYRQpW1k",
    authDomain: "gen-lang-client-0012000350.firebaseapp.com",
      projectId: "gen-lang-client-0012000350",
        storageBucket: "gen-lang-client-0012000350.firebasestorage.app",
          messagingSenderId: "719916234",
            appId: "1:719916234:web:3654058c409410122266a3"
            };

            // Initialize Firebase
            const app = initializeApp(firebaseConfig);

            // Initialize Firebase Authentication and get a reference to the service
            export const auth = getAuth(app);

            // Initialize Cloud Firestore and get a reference to the service
            export const db = getFirestore(app);

            // Export the app instance
            export default app;

            // Re-export Firebase functions for convenience
            export { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInAnonymously, onAuthStateChanged } from "firebase/auth";
            export { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";