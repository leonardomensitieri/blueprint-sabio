// Script para definir um usuário como administrador diretamente no Firestore
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase Admin com privilégios de serviço
// NOTA: Isso funciona sem necessidade de autenticação interativa
initializeApp({
  projectId: 'blueprint-sabio'
});

const db = getFirestore();

/**
 * Define um usuário como administrador pelo email
 * @param {string} email - Email do usuário a ser definido como administrador
 */
async function setAdminByEmail(email) {
  try {
    // Buscar o usuário pelo email
    console.log(`🔍 Buscando usuário com email: ${email}`);
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('email', '==', email).get();
    
    if (querySnapshot.empty) {
      console.log(`❌ Nenhum usuário encontrado com o email ${email}`);
      console.log('👉 Certifique-se de que este usuário já foi registrado no aplicativo.');
      return false;
    }
    
    let userUpdated = false;
    
    // Deve haver apenas um usuário com este email
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      console.log(`✅ Usuário encontrado: ${userId}`);
      
      try {
        // Atualizar o documento do usuário
        await db.collection('users').doc(userId).update({
          role: 'admin',
          hasActiveSubscription: true,
          updatedAt: new Date()
        });
        
        userUpdated = true;
        console.log(`✅ Usuário ${userId} (${email}) agora é um administrador com acesso permanente`);
      } catch (error) {
        console.error(`❌ Erro ao atualizar usuário ${userId}:`, error);
      }
    }
    
    return userUpdated;
  } catch (error) {
    console.error("❌ Erro ao definir administrador:", error);
    return false;
  }
}

// Email do administrador
const adminEmail = 'leonardomensitierii@gmail.com';

// Definir como administrador
setAdminByEmail(adminEmail)
  .then(success => {
    if (success) {
      console.log(`\n✨ ${adminEmail} agora é um administrador com acesso permanente no Blueprint Sábio.`);
    } else {
      console.log('\n❌ Não foi possível completar a operação.');
    }
    // Encerrar o script após a conclusão
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });