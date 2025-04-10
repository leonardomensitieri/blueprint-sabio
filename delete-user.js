const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Certifique-se de ter este arquivo

// Inicializar o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function deleteUser(email) {
  try {
    console.log(`Tentando excluir o usuário: ${email}`);
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`Usuário encontrado com ID: ${userId}`);
    
    // Excluir dados do Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    console.log(`Dados do usuário excluídos do Firestore`);
    
    // Excluir subcoleções
    const financialDataRef = admin.firestore().collection('users').doc(userId).collection('financialData');
    const financialDocs = await financialDataRef.get();
    
    if (!financialDocs.empty) {
      const batch = admin.firestore().batch();
      financialDocs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('Dados financeiros excluídos');
    }
    
    // Excluir o usuário da autenticação
    await admin.auth().deleteUser(userId);
    console.log(`Usuário excluído da autenticação`);
    
    console.log(`Usuário ${email} excluído com sucesso.`);
  } catch (error) {
    console.error(`Erro ao excluir usuário:`, error);
  }
}

async function setAdmin(email) {
  try {
    console.log(`Tentando promover o usuário: ${email}`);
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`Usuário encontrado com ID: ${userId}`);
    
    // Atualizar o documento do usuário
    await admin.firestore().collection('users').doc(userId).update({
      role: 'admin',
      hasActiveSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Usuário ${email} promovido a administrador com sucesso.`);
  } catch (error) {
    console.error(`Erro ao promover usuário:`, error);
  }
}

async function addSubscription(email) {
  try {
    console.log(`Tentando adicionar assinatura para o usuário: ${email}`);
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;
    
    console.log(`Usuário encontrado com ID: ${userId}`);
    
    // Atualizar o documento do usuário
    await admin.firestore().collection('users').doc(userId).update({
      hasActiveSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Assinatura premium adicionada para o usuário ${email} com sucesso.`);
  } catch (error) {
    console.error(`Erro ao adicionar assinatura:`, error);
  }
}

// Obter os argumentos da linha de comando
const action = process.argv[2]; // delete, admin, ou subscription
const email = process.argv[3];  // email do usuário

if (!email || !action) {
  console.error('Argumentos insuficientes');
  console.log('Uso: node delete-user.js [delete|admin|subscription] email@exemplo.com');
  process.exit(1);
}

// Executar a função apropriada
if (action === 'delete') {
  deleteUser(email)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else if (action === 'admin') {
  setAdmin(email)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else if (action === 'subscription') {
  addSubscription(email)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.error('Ação inválida. Use delete, admin ou subscription');
  console.log('Uso: node delete-user.js [delete|admin|subscription] email@exemplo.com');
  process.exit(1);
}