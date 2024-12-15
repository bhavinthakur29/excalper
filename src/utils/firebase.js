import { initializeApp } from "firebase/app";
import {
  getAuth,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCV4gb0cs5Yt9DpaFsXOKn6MgnxADc5oOI",
  authDomain: "personalexlogger.firebaseapp.com",
  projectId: "personalexlogger",
  storageBucket: "personalexlogger.firebasestorage.app",
  messagingSenderId: "1001958121806",
  appId: "1:1001958121806:web:d780662eb84e141d8f3e1f",
  measurementId: "G-9Q4SBBQTEK",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Export `updateProfile` for use in other files
export { db, RecaptchaVerifier, auth, analytics, updateProfile };
