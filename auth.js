// userpluss/auth.js
import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, setDoc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

export async function registerUser(email, password, nome, role = "funcionario") {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: email,
            nome: nome,
            role: role,
            createdAt: new Date().toISOString()
        }, { merge: true });

        return user;
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        throw error;
    }
}

export async function registerFirstAdmin(email, password, nome) {
    return registerUser(email, password, nome, "admin");
}

export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
    return signOut(auth);
}

export async function getUserRole(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data().role : null;
}

export async function getUserData(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? userDoc.data() : null;
}

export async function updateUserPassword(newPassword) {
    const user = auth.currentUser;
    if (user) {
        await updatePassword(user, newPassword);
    } else {
        throw new Error("Nenhum usuário logado.");
    }
}

export async function hasUsers() {
    const usersSnapshot = await getDocs(collection(db, "users"));
    return !usersSnapshot.empty;
}

export { onAuthStateChanged };