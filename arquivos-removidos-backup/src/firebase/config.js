import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAWQ5qNWYUaqEtlPGK0RMNX87-4fQN4lNw",
  authDomain: "blueprint-sabio.firebaseapp.com",
  projectId: "blueprint-sabio",
  storageBucket: "blueprint-sabio.appspot.com",
  messagingSenderId: "698133173309",
  appId: "1:698133173309:web:76aa76fe4efcc5df7a30d0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Exportar instâncias
export { db, auth, storage };
export default app;