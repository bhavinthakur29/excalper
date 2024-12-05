import { initializeApp } from "firebase/app";
import { getAuth, updateProfile } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCV4gb0cs5Yt9DpaFsXOKn6MgnxADc5oOI",
  authDomain: "personalexlogger.firebaseapp.com",
  projectId: "personalexlogger",
  storageBucket: "personalexlogger.firebasestorage.app",
  messagingSenderId: "1001958121806",
  appId: "1:1001958121806:web:d780662eb84e141d8f3e1f",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// Export `updateProfile` for use in other files
export { db, auth, updateProfile };
