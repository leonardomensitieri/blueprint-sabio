// Script para definir um usuário como administrador
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc, serverTimestamp } = require('firebase/firestore');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpZ2Xi69iDNgv9G6lMqYHQSiGmu0E-9Ho",
  authDomain: "blueprint-sabio.firebaseapp.com",
  projectId: "blueprint-sabio",
  storageBucket: "blueprint-sabio.firebasebasestorage.app",
  messagingSenderId: "948198115035",
  appId: "1:948198115035:web:dafc66782289433721eefe"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Define um usuário como administrador pelo email
 * @param {string} email - Email do usuário a ser definido como administrador
 */
const setAdminByEmail = async (email) => {
  try {
    // Buscar o usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`❌ Nenhum usuário encontrado com o email ${email}`);
      return false;
    }
    
    let userUpdated = false;
    
    // Atualizar todos os usuários com este email (normalmente deveria ser apenas um)
    for (const userDoc of querySnapshot.docs) {
      const userRef = doc(db, 'users', userDoc.id);
      await updateDoc(userRef, {
        role: 'admin',
        hasActiveSubscription: true,
        updatedAt: serverTimestamp()
      });
      userUpdated = true;
      console.log(`✅ Usuário ${userDoc.id} (${email}) agora é um administrador com acesso permanente`);
    }
    
    return userUpdated;
  } catch (error) {
    console.error("❌ Erro ao definir administrador:", error);
    return false;
  }
};

// Função para definir o usuário administrador
const setAdmin = async () => {
  // Define o email do administrador - Leonardo Mensiteri
  const adminEmail = 'leonardomensitierii@gmail.com';
  
  try {
    console.log(`🔑 Definindo ${adminEmail} como administrador...`);
    const success = await setAdminByEmail(adminEmail);
    
    if (success) {
      console.log(`✅ ${adminEmail} agora é um administrador com acesso permanente ao Blueprint Sábio.`);
    } else {
      console.error(`❌ Não foi possível definir ${adminEmail} como administrador.`);
      console.log('👉 Certifique-se de que este usuário já foi registrado no aplicativo.');
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
};

// Executar a função
setAdmin()
  .then(() => {
    console.log('✨ Script concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });