const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Para processamento de pagamentos com Stripe
// Remover comentário e configurar chave quando o Stripe estiver configurado
// const stripe = require('stripe')(functions.config().stripe.secret_key);

/**
 * Função acionada quando um novo usuário é criado
 * Inicializa automaticamente as propriedades padrão e estrutura de dados
 */
exports.initializeUserData = functions.auth.user().onCreate((user) => {
  const userId = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || '';
  const now = admin.firestore.FieldValue.serverTimestamp();
  
  // Documento principal do usuário com nova estrutura
  const userDoc = {
    name: displayName,
    email: email,
    phone: '',
    lives_abroad: false,
    how_found: '',
    age: 0,
    created_at: now,
    occupation: '',
    income: 0,
    patrimony: 0,
    message: '',
    life_insurance: false,
    patrimony_priority: '',
    income_priority: '',
    email_sent: false,
    hasActiveSubscription: false, // Corrigido: inicia como false
    role: 'user', // Corrigido: inicia como user
    updatedAt: now
  };
  
  // Documento de dados financeiros com valores padrão
  const financialDataDoc = {
    updatedAt: now,
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
  
  // Criar documentos no Firestore usando batch para garantir atomicidade
  const batch = admin.firestore().batch();
  
  // Adicionar documento principal do usuário
  const userRef = admin.firestore().collection('users').doc(userId);
  batch.set(userRef, userDoc);
  
  // Adicionar dados financeiros do usuário
  const financialDataRef = admin.firestore().collection('users').doc(userId).collection('financialData').doc('main');
  batch.set(financialDataRef, financialDataDoc);
  
  // Commit da transação em batch
  return batch.commit()
    .then(() => {
      console.log(`Usuário ${userId} inicializado com sucesso`);
      return null;
    })
    .catch(error => {
      console.error(`Erro ao inicializar usuário ${userId}:`, error);
      return null;
    });
});

/**
 * Função para promover um usuário para administrador
 * Isso define o usuário como admin e adiciona acesso premium automaticamente
 */
exports.setAdmin = functions.https.onCall(async (data, context) => {
  // Apenas administradores podem promover outros usuários
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para promover um usuário.'
    );
  }
  
  const callerUid = context.auth.uid;
  const userToPromoteEmail = data.email;
  
  try {
    // Verificar se o chamador é um administrador
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem promover usuários.'
      );
    }
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(userToPromoteEmail);
    const userToPromoteId = userRecord.uid;
    
    // Atualizar o documento do usuário
    await admin.firestore().collection('users').doc(userToPromoteId).update({
      role: 'admin',
      hasActiveSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      message: `Usuário ${userToPromoteEmail} agora é administrador com acesso premium.` 
    };
  } catch (error) {
    console.error(`Erro ao promover usuário ${userToPromoteEmail}:`, error);
    throw new functions.https.HttpsError('internal', `Erro ao promover usuário: ${error.message}`);
  }
});

/**
 * Função para adicionar assinatura a um usuário
 * Isso permite que administradores concedam acesso premium a qualquer usuário
 */
exports.addSubscription = functions.https.onCall(async (data, context) => {
  // Apenas administradores podem adicionar assinaturas
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para adicionar uma assinatura.'
    );
  }
  
  const callerUid = context.auth.uid;
  const userEmail = data.email;
  
  try {
    // Verificar se o chamador é um administrador
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem adicionar assinaturas.'
      );
    }
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(userEmail);
    const userId = userRecord.uid;
    
    // Atualizar o documento do usuário
    await admin.firestore().collection('users').doc(userId).update({
      hasActiveSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      message: `Assinatura premium adicionada para o usuário ${userEmail}.` 
    };
  } catch (error) {
    console.error(`Erro ao adicionar assinatura para ${userEmail}:`, error);
    throw new functions.https.HttpsError('internal', `Erro ao adicionar assinatura: ${error.message}`);
  }
});

/**
 * Função para excluir um usuário completamente
 * Isso exclui o usuário da autenticação e todos os seus dados no Firestore
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Apenas administradores podem excluir usuários
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para excluir um usuário.'
    );
  }
  
  const callerUid = context.auth.uid;
  const userToDeleteEmail = data.email;
  
  try {
    // Verificar se o chamador é um administrador
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
    
    if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Apenas administradores podem excluir usuários.'
      );
    }
    
    // Buscar o usuário por email
    const userRecord = await admin.auth().getUserByEmail(userToDeleteEmail);
    const userToDeleteId = userRecord.uid;
    
    // Excluir dados do Firestore
    await admin.firestore().collection('users').doc(userToDeleteId).delete();
    
    // Excluir subcoleções
    const financialDataRef = admin.firestore().collection('users').doc(userToDeleteId).collection('financialData');
    const financialDocs = await financialDataRef.get();
    
    // Excluir documentos da subcoleção financialData
    const financialBatch = admin.firestore().batch();
    financialDocs.forEach(doc => {
      financialBatch.delete(doc.ref);
    });
    await financialBatch.commit();
    
    // Excluir o usuário da autenticação
    await admin.auth().deleteUser(userToDeleteId);
    
    return { success: true, message: `Usuário ${userToDeleteEmail} excluído com sucesso.` };
  } catch (error) {
    console.error(`Erro ao excluir usuário ${userToDeleteEmail}:`, error);
    throw new functions.https.HttpsError('internal', `Erro ao excluir usuário: ${error.message}`);
  }
});

/**
 * Função para verificar o status de assinatura de um usuário
 */
exports.checkSubscriptionStatus = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para verificar seu status de assinatura.'
    );
  }
  
  const userId = context.auth.uid;
  
  try {
    // Buscar os dados do usuário
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado.');
    }
    
    const userData = userDoc.data();
    
    // Por enquanto, apenas retornar o status atual
    // No futuro, pode verificar com a API do Stripe, se necessário
    return { 
      hasActiveSubscription: userData.hasActiveSubscription || false,
      role: userData.role || 'user'
    };
  } catch (error) {
    console.error(`Erro ao verificar status de assinatura para ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Erro ao verificar status da assinatura.');
  }
});

/**
 * Função para atualizar totais dos dados financeiros
 * Pode ser chamada via HTTP ou em resposta a mudanças nos dados
 */
exports.updateFinancialTotals = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para atualizar seus dados financeiros.'
    );
  }
  
  const userId = context.auth.uid;
  
  try {
    // Buscar documento de dados financeiros atual
    const financialDoc = await admin.firestore()
      .collection('users').doc(userId)
      .collection('financialData').doc('main')
      .get();
    
    if (!financialDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Dados financeiros não encontrados.');
    }
    
    const financialData = financialDoc.data();
    
    // Calcular totais de ações baseado nos tickers existentes
    let totalAcoes = 0;
    const tickers = financialData.patrimonioAcoes?.tickers || {};
    
    Object.keys(tickers).forEach(ticker => {
      const tickerData = tickers[ticker];
      totalAcoes += (tickerData.valor || 
                   tickerData.quantidadeAcoes * (tickerData.precoMedio || 0));
    });
    
    // Obter outros totais
    const totalRendaFixa = financialData.patrimonioRendaFixa?.total || 0;
    const totalReservaEmergencia = financialData.patrimonioReservaDeEmergencia?.total || 0;
    
    // Calcular patrimônio total
    const patrimonioTotal = totalAcoes + totalRendaFixa + totalReservaEmergencia;
    
    // Atualizar documento de dados financeiros
    await admin.firestore()
      .collection('users').doc(userId)
      .collection('financialData').doc('main')
      .update({
        'patrimonioAcoes.total': totalAcoes,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Também atualizar o valor de patrimônio no documento principal do usuário
    await admin.firestore()
      .collection('users').doc(userId)
      .update({
        patrimony: patrimonioTotal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    return { success: true, patrimonioTotal };
  } catch (error) {
    console.error(`Erro ao atualizar totais para ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Erro ao atualizar totais financeiros.');
  }
});

/**
 * Função para processar webhooks do Stripe após pagamento bem-sucedido
 * Esta função deve ser chamada pelos webhooks do Stripe quando um pagamento é confirmado
 */
exports.processPayment = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para processar pagamentos.'
    );
  }
  
  const userId = context.auth.uid;
  const { paymentStatus, subscriptionId } = data;
  
  if (paymentStatus !== 'succeeded') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Status de pagamento inválido.'
    );
  }
  
  try {
    // Atualizar o status de assinatura do usuário
    await admin.firestore()
      .collection('users').doc(userId)
      .update({
        hasActiveSubscription: true,
        subscriptionId: subscriptionId || null,
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    // Armazenar registro de transação para histórico
    await admin.firestore()
      .collection('users').doc(userId)
      .collection('transactions').add({
        type: 'subscription',
        status: 'succeeded',
        subscriptionId: subscriptionId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    return { success: true, message: 'Assinatura ativada com sucesso.' };
  } catch (error) {
    console.error(`Erro ao processar pagamento para usuário ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Erro ao processar pagamento.');
  }
});

/**
 * Função para verificar status da assinatura do usuário
 * Útil para quando o usuário faz login e precisa verificar se tem acesso premium
 */
exports.checkSubscriptionStatus = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Você precisa estar logado para verificar status da assinatura.'
    );
  }
  
  const userId = context.auth.uid;
  
  try {
    // Buscar dados do usuário
    const userDoc = await admin.firestore()
      .collection('users').doc(userId)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Usuário não encontrado.');
    }
    
    const userData = userDoc.data();
    
    // Aqui poderia haver uma verificação com o Stripe para confirmar o status atual
    // da assinatura, especialmente se houver cancelamentos ou expiração
    
    return { 
      hasActiveSubscription: userData.hasActiveSubscription || false,
      subscriptionId: userData.subscriptionId || null,
      subscriptionUpdatedAt: userData.subscriptionUpdatedAt || null
    };
  } catch (error) {
    console.error(`Erro ao verificar status de assinatura para ${userId}:`, error);
    throw new functions.https.HttpsError('internal', 'Erro ao verificar status da assinatura.');
  }
});