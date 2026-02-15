
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5aS-tJjl7Ac4ZdE3e-HGl2uqMd0qGpSI",
  authDomain: "babyalbum-14b9a.firebaseapp.com",
  projectId: "babyalbum-14b9a",
  storageBucket: "babyalbum-14b9a.firebasestorage.app",
  messagingSenderId: "173822537294",
  appId: "1:173822537294:web:320c3f5688d8466126dd1f",
  measurementId: "G-WV99VL7TTN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
