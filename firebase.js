// userpluss/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrfI1JnSVfS_nzz_PauGotGIXQ4lL1hqg",
  authDomain: "tropa-alpha.firebaseapp.com",
  projectId: "tropa-alpha",
  storageBucket: "tropa-alpha.firebasestorage.app",
  messagingSenderId: "107983252684",
  appId: "1:107983252684:web:3f757f5e214e9dfadda669",
  measurementId: "G-116GMLZ0P5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);