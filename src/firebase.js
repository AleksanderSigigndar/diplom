import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFZraqrca2QmUHly_mfZsStmzpNG2-7Ag",
  authDomain: "diplom-f733e.firebaseapp.com",
  projectId: "diplom-f733e",
  storageBucket: "diplom-f733e.firebasestorage.app",
  messagingSenderId: "878530195830",
  appId: "1:878530195830:web:5d38da1a23c88aa486ca57",
  measurementId: "G-X21RSFT3L0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);