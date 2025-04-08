import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Configuração do Firebase (substitua pelos seus dados do console do Firebase)
const firebaseConfig = {
  apiKey: "sua-chave",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  // ... outras configs
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função de login
function login(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log("Usuário logado:", user.email, "UID:", user.uid);
    })
    .catch((error) => {
      console.error("Erro no login:", error.message);
    });
}

// Exemplo de uso
login("robertinho33@gmail.com", "senha123");