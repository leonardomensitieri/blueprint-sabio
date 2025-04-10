// Script para definir um usuário como administrador
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { setAdminByEmail } from '../firebase/db';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função para definir o usuário administrador
const setAdmin = async () => {
  // Define o email do administrador - Leonardo Mensiteri
  const adminEmail = 'leonardomensitierii@gmail.com';
  
  try {
    const result = await setAdminByEmail(adminEmail);
    if (result.success) {
      console.log('✅ Sucesso:', result.message);
    } else {
      console.error('❌ Erro:', result.message);
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
};

// Executar a função
setAdmin()
  .then(() => console.log('Script concluído.'))
  .catch(error => console.error('Erro no script:', error));