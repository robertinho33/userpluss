/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3785y6GPsFH7xuwfwjcBoPjvUfE3kSMw",
  authDomain: "alphaglamstart.firebaseapp.com",
  databaseURL: "https://alphaglamstart-default-rtdb.firebaseio.com",
  projectId: "alphaglamstart",
  storageBucket: "alphaglamstart.firebasestorage.app",
  messagingSenderId: "885178660314",
  appId: "1:885178660314:web:1bb3a78be9fa7fdcdefce3",
  measurementId: "G-094SYXW35Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);