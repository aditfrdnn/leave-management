// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDn7F1mXPYI5tRnuCG5XqrHFOgH3sdT4Wg",
  authDomain: "apps-leave.firebaseapp.com",
  projectId: "apps-leave",
  storageBucket: "apps-leave.appspot.com",
  messagingSenderId: "584150514454",
  appId: "1:584150514454:web:7fcf985c8831707c1aae37",
  measurementId: "G-EWSEG332B5",
  databaseURL: "https://apps-leave-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
