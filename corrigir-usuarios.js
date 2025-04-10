/**
 * Script para corrigir configurações de usuários no Firestore
 * Este script corrige os valores padrão de role e hasActiveSubscription
 * para todos os usuários regulares (não administradores)
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Certifique-se de ter este arquivo

// Inicializar o Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function corrigirUsuarios() {
  try {
    console.log('Iniciando correção de usuários...');
    
    // Obter todos os usuários
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('Nenhum usuário encontrado.');
      return;
    }
    
    // Usuários administrativos que devem manter as permissões
    const adminEmails = [
      'myobokucapital@gmail.com',
      'admin@blueprintsabio.com',
      'teste@exemplo.com'
    ];
    
    let corrigidos = 0;
    let semAlteracoes = 0;
    
    // Processar cada usuário
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Verificar se é um email administrativo
      const isAdminEmail = adminEmails.includes(userData.email);
      
      // Se não for um email administrativo, definir como usuário regular
      if (!isAdminEmail && (userData.role === 'admin' || userData.hasActiveSubscription === true)) {
        console.log(`Corrigindo usuário: ${userData.email}`);
        
        await db.collection('users').doc(userDoc.id).update({
          role: 'user',
          hasActiveSubscription: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Verificar se existe a subcoleção financialData
        const financialDoc = await db.collection('users').doc(userDoc.id).collection('financialData').doc('main').get();
        
        // Se não existir, criar
        if (!financialDoc.exists) {
          console.log(`  Criando dados financeiros para: ${userData.email}`);
          
          // Documento de dados financeiros com valores padrão
          const financialDataDoc = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            poderDeAporte: 0,
            custoDeVidaMensal: 0,
            patrimonioAcoes: {
              total: 0,
              tickers: {}
            },
            patrimonioRendaFixa: {
              total: 0,
              tempoInvestido: ''
            },
            patrimonioReservaDeEmergencia: {
              total: 0
            }
          };
          
          await db.collection('users').doc(userDoc.id).collection('financialData').doc('main').set(financialDataDoc);
        }
        
        corrigidos++;
      } else {
        console.log(`Sem alterações necessárias para: ${userData.email}`);
        semAlteracoes++;
      }
    }
    
    console.log(`
======================================
Correção finalizada!
======================================
${corrigidos} usuários corrigidos
${semAlteracoes} usuários sem alterações necessárias
    `);
    
  } catch (error) {
    console.error('Erro ao corrigir usuários:', error);
  }
}

// Executar a função principal
corrigirUsuarios()
  .then(() => {
    console.log('Script concluído.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro no script:', error);
    process.exit(1);
  });