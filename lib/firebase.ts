import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAf1YuXK-s504Ak7-sMVSKMpASWpXVyl34",
  authDomain: "fooddash-14b6b.firebaseapp.com",
  projectId: "fooddash-14b6b",
  storageBucket: "fooddash-14b6b.firebasestorage.app",
  messagingSenderId: "725112346439",
  appId: "1:725112346439:web:1ee5c3d63c6e5ba1cfde62",
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
