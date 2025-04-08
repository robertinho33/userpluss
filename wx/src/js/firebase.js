// src/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB3785y6GPsFH7xuwfwjcBoPjvUfE3kSMw",
    authDomain: "alphaglamstart.firebaseapp.com",
    projectId: "alphaglamstart",
    storageBucket: "alphaglamstart.appspot.com",
    messagingSenderId: "885178660314",
    appId: "1:885178660314:web:1bb3a78be9fa7fdcdefce3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    doc, 
    query, 
    where 
};