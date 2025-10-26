// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAvScK5Sjfkd8nZ5NPwzIgjRL9bspvl-Lk",
  authDomain: "rythmhacks-262d0.firebaseapp.com",
  projectId: "rythmhacks-262d0",
  storageBucket: "rythmhacks-262d0.firebasestorage.app",
  messagingSenderId: "223337098379",
  appId: "1:223337098379:web:b9ad4995c881e5d4b7388e",
  measurementId: "G-NSPY3TPNPX"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export your `auth` instance
export const auth = getAuth(app);
