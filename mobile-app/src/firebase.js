import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyAvScK5Sjfkd8nZ5NPwzIgjRL9bspvl-Lk",
authDomain: "rythmhacks-262d0.firebaseapp.com",
projectId: "rythmhacks-262d0",
storageBucket: "rythmhacks-262d0.firebasestorage.app",
messagingSenderId: "223337098379",
appId: "1:223337098379:web:b9ad4995c881e5d4b7388e",
measurementId: "G-NSPY3TPNPX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);