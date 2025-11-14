// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDaGPrBLNT_QPYYH0nzrZeZ4JOIgDIyXFY",
  authDomain: "agenticai-43929.firebaseapp.com",
  projectId: "agenticai-43929",
  storageBucket: "agenticai-43929.firebasestorage.app",
  messagingSenderId: "766079964459",
  appId: "1:766079964459:web:00b44c8984d22170da216e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
export default app;
