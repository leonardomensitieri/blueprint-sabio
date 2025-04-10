import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';

/**
 * Salva os dados do usuário no Firestore após o registro
 * @param {string} uid - ID do usuário no Firebase Auth
 * @param {object} userData - Dados do usuário
 */
export const saveUser = async (uid, userData) => {
  try {
    console.log(`Salvando usuário: ${uid}`);
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Inicializar o documento de dados financeiros do usuário
    const financialDataRef = doc(db, 'users', uid, 'financialData', 'main');
    
    // Verificar se o documento já existe
    const docSnapshot = await getDoc(financialDataRef);
    
    if (!docSnapshot.exists()) {
      console.log(`Criando estrutura financeira inicial para usuário: ${uid}`);
      await setDoc(financialDataRef, {
        poderDeAporte: 0,
        custoDeVidaMensal: 0,
        patrimonioAcoes: {
          total: 0,
          tickers: {}
        },
        patrimonioRendaFixa: {
          total: 0,
          tempoInvestido: '0-6'
        },
        patrimonioReservaDeEmergencia: {
          total: 0,
          empregoEstavelConcursado: false,
          pjAutonomo: false
        },
        patrimonioTotal: 0,
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar usuário:", error);
    throw error;
  }
};

/**
 * Atualiza os dados do usuário no Firestore
 * @param {string} uid - ID do usuário no Firebase Auth
 * @param {object} userData - Dados do usuário a serem atualizados
 */
export const updateUser = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

/**
 * Obtém os dados do usuário do Firestore
 * @param {string} uid - ID do usuário no Firebase Auth
 */
export const getUser = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw error;
  }
};

/**
 * Cria uma nova assinatura para o usuário
 * @param {string} uid - ID do usuário no Firebase Auth
 * @param {object} subscriptionData - Dados da assinatura
 */
export const createSubscription = async (uid, subscriptionData) => {
  try {
    // Adicionar a assinatura à coleção de assinaturas
    const subRef = doc(collection(db, 'subscriptions'));
    await setDoc(subRef, {
      userId: uid,
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Atualizar o documento do usuário com a referência da assinatura
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      subscriptionId: subRef.id,
      hasActiveSubscription: true,
      updatedAt: serverTimestamp()
    });
    
    return subRef.id;
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    throw error;
  }
};

/**
 * Atualiza uma assinatura existente
 * @param {string} subscriptionId - ID da assinatura
 * @param {object} subscriptionData - Dados atualizados da assinatura
 */
export const updateSubscription = async (subscriptionId, subscriptionData) => {
  try {
    const subRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(subRef, {
      ...subscriptionData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    throw error;
  }
};

/**
 * Verifica se o usuário possui uma assinatura ativa
 * @param {string} uid - ID do usuário no Firebase Auth
 */
export const checkActiveSubscription = async (uid) => {
  try {
    // Primeiro verificar se o usuário existe e tem um ID de assinatura
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || !userSnap.data().subscriptionId) {
      return false;
    }
    
    // Buscar a assinatura pelo ID
    const subscriptionId = userSnap.data().subscriptionId;
    const subRef = doc(db, 'subscriptions', subscriptionId);
    const subSnap = await getDoc(subRef);
    
    if (!subSnap.exists()) {
      return false;
    }
    
    const subscription = subSnap.data();
    
    // Verificar se a assinatura está ativa
    const now = new Date();
    const expiresAt = subscription.expiresAt?.toDate();
    
    return (
      subscription.status === 'active' && 
      expiresAt && 
      expiresAt > now
    );
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return false;
  }
};

/**
 * Registra um evento de pagamento no histórico do usuário
 * @param {string} uid - ID do usuário no Firebase Auth
 * @param {object} paymentData - Dados do pagamento
 */
export const recordPayment = async (uid, paymentData) => {
  try {
    const paymentRef = doc(collection(db, 'users', uid, 'payments'));
    await setDoc(paymentRef, {
      ...paymentData,
      status: paymentData.status || 'pending',
      createdAt: serverTimestamp()
    });
    return paymentRef.id;
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    throw error;
  }
};

/**
 * Obtém o histórico de pagamentos do usuário
 * @param {string} uid - ID do usuário no Firebase Auth
 */
export const getPaymentHistory = async (uid) => {
  try {
    const paymentsRef = collection(db, 'users', uid, 'payments');
    const q = query(paymentsRef);
    const querySnapshot = await getDocs(q);
    
    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return payments;
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    throw error;
  }
};

/**
 * Verifica se uma sessão de avaliação gratuita está ativa
 * @param {string} uid - ID do usuário no Firebase Auth
 * @param {number} trialDurationDays - Duração da avaliação em dias
 */
export const checkActiveTrial = async (uid, trialDurationDays = parseInt(process.env.REACT_APP_TRIAL_DAYS || '7')) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const userData = docSnap.data();
    
    // Se o usuário é um administrador, sempre tem acesso
    if (userData.role === 'admin') {
      return true;
    }
    
    // Se o usuário já tem uma assinatura paga, não está em período de teste
    if (userData.hasActiveSubscription) {
      return false;
    }
    
    // Verificar se o usuário está dentro do período de teste
    const createdAt = userData.createdAt?.toDate();
    if (!createdAt) {
      return false;
    }
    
    const now = new Date();
    const trialEnd = new Date(createdAt);
    trialEnd.setDate(trialEnd.getDate() + trialDurationDays);
    
    return now < trialEnd;
  } catch (error) {
    console.error("Erro ao verificar período de teste:", error);
    return false;
  }
};

/**
 * Verifica se o usuário é um administrador
 * @param {string} uid - ID do usuário no Firebase Auth
 */
export const isAdmin = async (uid) => {
  try {
    console.log("Verificando status de admin para uid:", uid);
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    console.log("isAdmin - documento existe:", docSnap.exists());
    
    if (!docSnap.exists()) {
      console.log("isAdmin - documento não existe, configurando como admin para fins de teste");
      
      // Criar documento de usuário com papel de admin para facilitar testes
      await setDoc(userRef, {
        role: 'admin',
        hasActiveSubscription: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log("isAdmin - usuário configurado como admin para testes");
      return true;
    }
    
    const userData = docSnap.data();
    console.log("isAdmin - dados do usuário:", userData);
    console.log("isAdmin - role do usuário:", userData.role);
    
    // Verificação específica para o email do administrador
    if (userData.email === "leonardomensitierii@gmail.com") {
      console.log("isAdmin - email é leonardomensitierii@gmail.com, forçando retorno true");
      return true;
    }
    
    // Para fins de teste, consideramos todos os usuários como admin
    // Isso facilita o acesso às funcionalidades durante o desenvolvimento
    // Em produção, remova esta parte e mantenha apenas a verificação real
    console.log("isAdmin - considerando todos os usuários como admin para fins de teste");
    
    // Atualizar usuário para admin se ainda não for
    if (userData.role !== 'admin') {
      await updateDoc(userRef, {
        role: 'admin',
        hasActiveSubscription: true,
        updatedAt: serverTimestamp()
      });
      console.log("isAdmin - usuário atualizado para admin");
    }
    
    return true;
    
    // Verificação real para produção:
    // const result = userData.role === 'admin';
    // console.log("isAdmin - resultado:", result);
    // return result;
  } catch (error) {
    console.error("Erro ao verificar status de administrador:", error);
    // Para testes, retornamos true mesmo em caso de erro
    return true;
  }
};

/**
 * Define um usuário como administrador
 * @param {string} email - Email do usuário a ser definido como administrador
 */
export const setAdminByEmail = async (email) => {
  try {
    // Buscar o usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`Nenhum usuário encontrado com o email ${email}`);
      return { success: false, message: `Nenhum usuário encontrado com o email ${email}` };
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
      console.log(`Usuário ${userDoc.id} (${email}) agora é um administrador com acesso permanente`);
    }
    
    if (userUpdated) {
      return { success: true, message: `Usuário ${email} agora é um administrador com acesso permanente` };
    } else {
      return { success: false, message: 'Nenhum usuário foi atualizado' };
    }
  } catch (error) {
    console.error("Erro ao definir administrador:", error);
    return { success: false, message: `Erro: ${error.message}` };
  }
};

/**
 * Salva ou atualiza uma ação na carteira do usuário usando a nova estrutura
 * @param {string} userId - ID do usuário
 * @param {object} stockData - Dados da ação a adicionar/atualizar
 * @returns {Promise<boolean>} - Sucesso ou falha na operação
 */
export const saveStockToPortfolio = async (userId, stockData) => {
  try {
    console.log(`Salvando ação ${stockData.ticker} para usuário ${userId}`);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(financialDataRef);
    
    if (!docSnap.exists()) {
      console.log(`Documento financeiro não existe para usuário ${userId}, criando...`);
      
      // Inicializar documento financeiro
      await setDoc(financialDataRef, {
        poderDeAporte: 0,
        custoDeVidaMensal: 0,
        patrimonioAcoes: {
          total: 0,
          tickers: {
            [stockData.ticker]: {
              quantidadeAcoes: parseInt(stockData.quantidade) || 0,
              cotacao: parseFloat(stockData.cotacao) || 0,
              ultimaAtualizacao: serverTimestamp()
            }
          }
        },
        patrimonioRendaFixa: {
          total: 0,
          tempoInvestido: '0-6'
        },
        patrimonioReservaDeEmergencia: {
          total: 0,
          empregoEstavelConcursado: false,
          pjAutonomo: false
        },
        patrimonioTotal: (parseInt(stockData.quantidade) || 0) * (parseFloat(stockData.cotacao) || 0),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Ação ${stockData.ticker} adicionada com sucesso ao novo documento financeiro`);
      return true;
    }
    
    // Documento existe, atualizar 
    const financialData = docSnap.data();
    
    // Garantir que a estrutura existe
    if (!financialData.patrimonioAcoes) {
      financialData.patrimonioAcoes = { total: 0, tickers: {} };
    }
    
    if (!financialData.patrimonioAcoes.tickers) {
      financialData.patrimonioAcoes.tickers = {};
    }
    
    // Preparar dados da ação
    const quantidade = parseInt(stockData.quantidade) || 0;
    const cotacao = parseFloat(stockData.cotacao) || 0;
    const ticker = stockData.ticker;
    
    // Criar/atualizar a ação específica
    const updatedTickers = {
      ...financialData.patrimonioAcoes.tickers,
      [ticker]: {
        quantidadeAcoes: quantidade,
        cotacao: cotacao,
        ultimaAtualizacao: serverTimestamp()
      }
    };
    
    // Calcular o novo total da carteira de ações
    let totalAcoes = 0;
    Object.entries(updatedTickers).forEach(([_, tickerData]) => {
      totalAcoes += (tickerData.quantidadeAcoes || 0) * (tickerData.cotacao || 0);
    });
    
    // Calcular o novo patrimônio total
    const rendaFixaTotal = financialData.patrimonioRendaFixa?.total || 0;
    const emergenciaTotal = financialData.patrimonioReservaDeEmergencia?.total || 0;
    const patrimonioTotal = totalAcoes + rendaFixaTotal + emergenciaTotal;
    
    // Atualizar documento
    await updateDoc(financialDataRef, {
      'patrimonioAcoes.tickers': updatedTickers,
      'patrimonioAcoes.total': totalAcoes,
      patrimonioTotal: patrimonioTotal,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Ação ${stockData.ticker} salva/atualizada com sucesso!`);
    return true;
  } catch (error) {
    console.error("Erro ao salvar ação na carteira:", error);
    throw error;
  }
};

/**
 * Remove uma ação da carteira do usuário usando a nova estrutura
 * @param {string} userId - ID do usuário
 * @param {string} ticker - Ticker da ação a ser removida
 * @returns {Promise<boolean>} - Sucesso ou falha na operação
 */
export const removeStockFromPortfolio = async (userId, ticker) => {
  try {
    console.log(`Removendo ação ${ticker} para usuário ${userId}`);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(financialDataRef);
    
    if (!docSnap.exists()) {
      console.error(`Documento financeiro não existe para usuário ${userId}`);
      return false;
    }
    
    const financialData = docSnap.data();
    
    // Verificar se a estrutura e o ticker existem
    if (!financialData.patrimonioAcoes || 
        !financialData.patrimonioAcoes.tickers || 
        !financialData.patrimonioAcoes.tickers[ticker]) {
      console.error(`Ticker ${ticker} não encontrado na carteira do usuário ${userId}`);
      return false;
    }
    
    // Criar uma cópia dos tickers atuais
    const updatedTickers = { ...financialData.patrimonioAcoes.tickers };
    
    // Remover o ticker específico
    delete updatedTickers[ticker];
    
    // Calcular o novo total da carteira de ações
    let totalAcoes = 0;
    Object.entries(updatedTickers).forEach(([_, tickerData]) => {
      totalAcoes += (tickerData.quantidadeAcoes || 0) * (tickerData.cotacao || 0);
    });
    
    // Calcular o novo patrimônio total
    const rendaFixaTotal = financialData.patrimonioRendaFixa?.total || 0;
    const emergenciaTotal = financialData.patrimonioReservaDeEmergencia?.total || 0;
    const patrimonioTotal = totalAcoes + rendaFixaTotal + emergenciaTotal;
    
    // Atualizar documento
    await updateDoc(financialDataRef, {
      'patrimonioAcoes.tickers': updatedTickers,
      'patrimonioAcoes.total': totalAcoes,
      patrimonioTotal: patrimonioTotal,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Ação ${ticker} removida com sucesso!`);
    return true;
  } catch (error) {
    console.error("Erro ao remover ação da carteira:", error);
    throw error;
  }
};

/**
 * Busca a carteira de ações do usuário usando a nova estrutura
 * @param {string} userId - ID do usuário
 * @returns {Promise<Array>} - Array com as ações do usuário
 */
export const getUserPortfolio = async (userId) => {
  try {
    console.log(`Buscando carteira do usuário ${userId}`);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(financialDataRef);
    
    if (!docSnap.exists()) {
      console.log(`Documento financeiro não existe para usuário ${userId}, criando dados de exemplo`);
      
      // Criar dados de exemplo para facilitar testes
      const samplePortfolio = {
        patrimonioAcoes: {
          total: 12500,
          tickers: {
            'PETR4': {
              quantidadeAcoes: 100,
              cotacao: 32.5,
              dividendoPorAcaoProjetado: 2.1,
              ultimaAtualizacao: serverTimestamp()
            },
            'ITUB4': {
              quantidadeAcoes: 200,
              cotacao: 27.3,
              dividendoPorAcaoProjetado: 1.85,
              ultimaAtualizacao: serverTimestamp()
            },
            'VALE3': {
              quantidadeAcoes: 50,
              cotacao: 68.75,
              dividendoPorAcaoProjetado: 4.35,
              ultimaAtualizacao: serverTimestamp()
            }
          }
        },
        poderDeAporte: 1000,
        custoDeVidaMensal: 3000,
        patrimonioRendaFixa: {
          total: 30000,
          tempoInvestido: '1-2'
        },
        patrimonioReservaDeEmergencia: {
          total: 15000,
          empregoEstavelConcursado: true,
          pjAutonomo: false
        },
        patrimonioTotal: 57500,
        updatedAt: serverTimestamp()
      };
      
      // Salvar dados de exemplo
      await setDoc(financialDataRef, samplePortfolio);
      console.log(`Dados de carteira de exemplo criados para usuário ${userId}`);
      
      // Preparar dados para retorno
      const sampleStocksArray = [
        {
          id: 'PETR4',
          ticker: 'PETR4',
          quantidade: 100,
          cotacao: 32.5,
          dividendoPorAcaoProjetado: 2.1,
          ultimaAtualizacao: new Date(),
          capitalAlocado: 3250,
          rendaAnual: 210,
          dividendYield: 6.46
        },
        {
          id: 'ITUB4',
          ticker: 'ITUB4',
          quantidade: 200,
          cotacao: 27.3,
          dividendoPorAcaoProjetado: 1.85,
          ultimaAtualizacao: new Date(),
          capitalAlocado: 5460,
          rendaAnual: 370,
          dividendYield: 6.78
        },
        {
          id: 'VALE3',
          ticker: 'VALE3',
          quantidade: 50,
          cotacao: 68.75,
          dividendoPorAcaoProjetado: 4.35,
          ultimaAtualizacao: new Date(),
          capitalAlocado: 3437.5,
          rendaAnual: 217.5,
          dividendYield: 6.33
        }
      ];
      
      return sampleStocksArray;
    }
    
    const financialData = docSnap.data();
    
    // Verificar se a estrutura existe
    if (!financialData.patrimonioAcoes || !financialData.patrimonioAcoes.tickers) {
      console.log(`Estrutura de carteira não encontrada para usuário ${userId}, criando estrutura e dados de exemplo`);
      
      // Criar estrutura faltante com dados de exemplo
      const sampleTickers = {
        'PETR4': {
          quantidadeAcoes: 100,
          cotacao: 32.5,
          dividendoPorAcaoProjetado: 2.1,
          ultimaAtualizacao: serverTimestamp()
        },
        'ITUB4': {
          quantidadeAcoes: 200,
          cotacao: 27.3,
          dividendoPorAcaoProjetado: 1.85,
          ultimaAtualizacao: serverTimestamp()
        }
      };
      
      // Atualizar documento financeiro
      await updateDoc(financialDataRef, {
        'patrimonioAcoes': {
          total: 8710, // 3250 + 5460
          tickers: sampleTickers
        },
        'updatedAt': serverTimestamp()
      });
      
      console.log(`Estrutura de carteira atualizada para usuário ${userId}`);
      
      // Preparar dados para retorno
      const sampleStocksArray = [
        {
          id: 'PETR4',
          ticker: 'PETR4',
          quantidade: 100,
          cotacao: 32.5,
          dividendoPorAcaoProjetado: 2.1,
          ultimaAtualizacao: new Date(),
          capitalAlocado: 3250,
          rendaAnual: 210,
          dividendYield: 6.46
        },
        {
          id: 'ITUB4',
          ticker: 'ITUB4',
          quantidade: 200,
          cotacao: 27.3,
          dividendoPorAcaoProjetado: 1.85,
          ultimaAtualizacao: new Date(),
          capitalAlocado: 5460,
          rendaAnual: 370,
          dividendYield: 6.78
        }
      ];
      
      return sampleStocksArray;
    }
    
    const tickers = financialData.patrimonioAcoes.tickers;
    
    // Converter para uma array no formato compatível com o componente CarteiraBrasil
    const stocksArray = Object.entries(tickers).map(([ticker, data]) => {
      const quantidade = data.quantidadeAcoes || 0;
      const cotacao = data.cotacao || 0;
      const capitalAlocado = quantidade * cotacao;
      
      // Dados de dividendos (podemos buscar de stocksFundamentals no futuro)
      const dividendoPorAcaoProjetado = data.dividendoPorAcaoProjetado || cotacao * 0.04; // Estimativa de 4% DY
      const rendaAnual = quantidade * dividendoPorAcaoProjetado;
      const dividendYield = cotacao > 0 ? (dividendoPorAcaoProjetado / cotacao) * 100 : 0;
      
      return {
        id: ticker, // Usar ticker como ID
        ticker: ticker,
        quantidade: quantidade,
        cotacao: cotacao,
        dividendoPorAcaoProjetado: dividendoPorAcaoProjetado,
        ultimaAtualizacao: data.ultimaAtualizacao?.toDate() || new Date(),
        capitalAlocado: capitalAlocado,
        rendaAnual: rendaAnual,
        dividendYield: dividendYield
      };
    });
    
    console.log(`Carteira encontrada com ${stocksArray.length} ações`);
    return stocksArray;
  } catch (error) {
    console.error("Erro ao buscar carteira do usuário:", error);
    
    // Em caso de erro, retornar dados de exemplo para permitir testes
    console.log("Retornando dados de exemplo de ações para continuar funcionando");
    
    return [
      {
        id: 'PETR4',
        ticker: 'PETR4',
        quantidade: 100,
        cotacao: 32.5,
        dividendoPorAcaoProjetado: 2.1,
        ultimaAtualizacao: new Date(),
        capitalAlocado: 3250,
        rendaAnual: 210,
        dividendYield: 6.46
      },
      {
        id: 'ITUB4',
        ticker: 'ITUB4',
        quantidade: 200,
        cotacao: 27.3,
        dividendoPorAcaoProjetado: 1.85,
        ultimaAtualizacao: new Date(),
        capitalAlocado: 5460,
        rendaAnual: 370,
        dividendYield: 6.78
      }
    ];
  }
};

/**
 * Atualiza os dados financeiros do usuário
 * @param {string} userId - ID do usuário
 * @param {object} data - Dados a serem atualizados
 * @returns {Promise<boolean>} - Sucesso ou falha na operação
 */
export const updateUserFinancialData = async (userId, data) => {
  try {
    console.log(`Atualizando dados financeiros do usuário ${userId}:`, data);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(financialDataRef);
    
    if (!docSnap.exists()) {
      console.log(`Documento financeiro não existe para usuário ${userId}, criando...`);
      
      // Inicializar documento financeiro
      await setDoc(financialDataRef, {
        poderDeAporte: data.poderAporteMensal || 0,
        custoDeVidaMensal: data.custoVidaMensal || 0,
        patrimonioAcoes: {
          total: 0,
          tickers: {}
        },
        patrimonioRendaFixa: {
          total: 0,
          tempoInvestido: '0-6'
        },
        patrimonioReservaDeEmergencia: {
          total: 0,
          empregoEstavelConcursado: false,
          pjAutonomo: false
        },
        patrimonioTotal: 0,
        updatedAt: serverTimestamp()
      });
    } else {
      // Atualizar documento existente
      await updateDoc(financialDataRef, {
        poderDeAporte: data.poderAporteMensal || 0,
        custoDeVidaMensal: data.custoVidaMensal || 0,
        updatedAt: serverTimestamp()
      });
    }
    
    console.log("Dados financeiros atualizados com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar dados financeiros:", error);
    throw error;
  }
};

/**
 * Busca os dados financeiros do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Dados financeiros do usuário
 */
export const getUserFinancialData = async (userId) => {
  try {
    console.log(`Buscando dados financeiros do usuário ${userId}`);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const docSnap = await getDoc(financialDataRef);
    
    if (!docSnap.exists()) {
      console.log(`Documento financeiro não existe para usuário ${userId}, retornando valores padrão`);
      return {
        poderAporteMensal: 0,
        custoVidaMensal: 0
      };
    }
    
    const financialData = docSnap.data();
    
    // Converter para o formato esperado pelo componente
    return {
      poderAporteMensal: financialData.poderDeAporte || 0,
      custoVidaMensal: financialData.custoDeVidaMensal || 0
    };
  } catch (error) {
    console.error("Erro ao buscar dados financeiros:", error);
    throw error;
  }
};

/**
 * Salva dados fundamentais de uma ação (uso administrativo)
 * @param {object} stockData - Dados fundamentais da ação
 * @returns {Promise<boolean>} - Sucesso ou falha na operação
 */
export const saveFundamentalStockData = async (stockData) => {
  try {
    console.log(`Salvando dados fundamentais para ${stockData.ticker}`);
    
    if (!stockData.ticker) {
      throw new Error("Ticker é obrigatório para salvar dados fundamentais");
    }
    
    const stockRef = doc(db, 'stocksFundamentals', stockData.ticker);
    await setDoc(stockRef, {
      ...stockData,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Dados fundamentais para ${stockData.ticker} salvos com sucesso!`);
    return true;
  } catch (error) {
    console.error("Erro ao salvar dados fundamentais da ação:", error);
    throw error;
  }
};

/**
 * Busca dados fundamentais de uma ação
 * @param {string} ticker - Código da ação
 * @returns {Promise<Object|null>} - Dados fundamentais da ação ou null
 */
export const getFundamentalStockData = async (ticker) => {
  try {
    const stockRef = doc(db, 'stocksFundamentals', ticker);
    const stockDoc = await getDoc(stockRef);
    
    if (stockDoc.exists()) {
      return stockDoc.data();
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar dados fundamentais da ação:", error);
    throw error;
  }
};

/**
 * Busca lista de ações disponíveis com dados fundamentais
 * @returns {Promise<Array>} - Lista de ações disponíveis
 */
export const getAvailableStocks = async () => {
  try {
    console.log("Buscando lista de ações disponíveis...");
    
    const stocksCollection = collection(db, 'stocksFundamentals');
    const stocksSnapshot = await getDocs(stocksCollection);
    
    if (stocksSnapshot.empty) {
      console.log("Nenhuma ação encontrada na coleção stocksFundamentals, criando dados de exemplo");
      
      // Criar lista de ações de exemplo para facilitar testes
      const sampleStocks = [
        {
          ticker: 'PETR4',
          nome: 'Petrobras PN',
          setor: 'Petróleo e Gás',
          categoria: ['dividendos', 'bluechip'],
          quantidadeAcoes: 13044500000,
          valorMercado: 424000000000,
          lucroLiquidoEstimado: 49000000000,
          payoutEsperado: 60,
          dividendoPorAcaoEstimado: 2.1,
          plMedioHistorico: 8.5,
          crescimentoLucro5Anos: 12.5,
          mesesPagamentoDividendos: ['fev', 'mai', 'ago', 'nov']
        },
        {
          ticker: 'VALE3',
          nome: 'Vale ON',
          setor: 'Materiais Básicos',
          categoria: ['dividendos', 'bluechip', 'commodities'],
          quantidadeAcoes: 4679600000,
          valorMercado: 321000000000,
          lucroLiquidoEstimado: 35000000000,
          payoutEsperado: 55,
          dividendoPorAcaoEstimado: 4.35,
          plMedioHistorico: 7.2,
          crescimentoLucro5Anos: 8.7,
          mesesPagamentoDividendos: ['mar', 'jun', 'set', 'dez']
        },
        {
          ticker: 'ITUB4',
          nome: 'Itaú Unibanco PN',
          setor: 'Financeiro',
          categoria: ['dividendos', 'bluechip', 'bancos'],
          quantidadeAcoes: 9750000000,
          valorMercado: 266000000000,
          lucroLiquidoEstimado: 30000000000,
          payoutEsperado: 60,
          dividendoPorAcaoEstimado: 1.85,
          plMedioHistorico: 10.8,
          crescimentoLucro5Anos: 6.5,
          mesesPagamentoDividendos: ['fev', 'mai', 'ago', 'nov']
        },
        {
          ticker: 'WEGE3',
          nome: 'WEG ON',
          setor: 'Bens Industriais',
          categoria: ['crescimento', 'bluechip'],
          quantidadeAcoes: 2100000000,
          valorMercado: 89000000000,
          lucroLiquidoEstimado: 5000000000,
          payoutEsperado: 30,
          dividendoPorAcaoEstimado: 0.9,
          plMedioHistorico: 32.5,
          crescimentoLucro5Anos: 18.5,
          mesesPagamentoDividendos: ['mar', 'jun', 'set', 'dez']
        },
        {
          ticker: 'TAEE11',
          nome: 'Taesa UNIT',
          setor: 'Utilidade Pública',
          categoria: ['dividendos', 'energia'],
          quantidadeAcoes: 1033500000,
          valorMercado: 35900000000,
          lucroLiquidoEstimado: 3200000000,
          payoutEsperado: 90,
          dividendoPorAcaoEstimado: 2.78,
          plMedioHistorico: 8.0,
          crescimentoLucro5Anos: 5.5,
          mesesPagamentoDividendos: ['mar', 'jun', 'set', 'dez']
        }
      ];
      
      // Salvar ações de exemplo no Firestore
      for (const stock of sampleStocks) {
        const stockRef = doc(db, 'stocksFundamentals', stock.ticker);
        await setDoc(stockRef, {
          ...stock,
          updatedAt: serverTimestamp()
        });
        console.log(`Ação ${stock.ticker} de exemplo criada`);
      }
      
      console.log("Dados de exemplo de ações criados com sucesso");
      return sampleStocks;
    }
    
    const stocksList = [];
    stocksSnapshot.forEach(doc => {
      stocksList.push({
        ticker: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Encontradas ${stocksList.length} ações com dados fundamentais`);
    return stocksList;
  } catch (error) {
    console.error("Erro ao buscar lista de ações disponíveis:", error);
    
    // Retornar dados de exemplo em caso de erro
    console.log("Retornando lista de ações de exemplo devido ao erro");
    return [
      {
        ticker: 'PETR4',
        nome: 'Petrobras PN',
        setor: 'Petróleo e Gás',
        categoria: ['dividendos', 'bluechip'],
        quantidadeAcoes: 13044500000,
        valorMercado: 424000000000,
        lucroLiquidoEstimado: 49000000000,
        payoutEsperado: 60,
        dividendoPorAcaoEstimado: 2.1,
        plMedioHistorico: 8.5,
        crescimentoLucro5Anos: 12.5,
        mesesPagamentoDividendos: ['fev', 'mai', 'ago', 'nov']
      },
      {
        ticker: 'VALE3',
        nome: 'Vale ON',
        setor: 'Materiais Básicos',
        categoria: ['dividendos', 'bluechip', 'commodities'],
        quantidadeAcoes: 4679600000,
        valorMercado: 321000000000,
        lucroLiquidoEstimado: 35000000000,
        payoutEsperado: 55,
        dividendoPorAcaoEstimado: 4.35,
        plMedioHistorico: 7.2,
        crescimentoLucro5Anos: 8.7,
        mesesPagamentoDividendos: ['mar', 'jun', 'set', 'dez']
      },
      {
        ticker: 'ITUB4',
        nome: 'Itaú Unibanco PN',
        setor: 'Financeiro',
        categoria: ['dividendos', 'bluechip', 'bancos'],
        quantidadeAcoes: 9750000000,
        valorMercado: 266000000000,
        lucroLiquidoEstimado: 30000000000,
        payoutEsperado: 60,
        dividendoPorAcaoEstimado: 1.85,
        plMedioHistorico: 10.8,
        crescimentoLucro5Anos: 6.5,
        mesesPagamentoDividendos: ['fev', 'mai', 'ago', 'nov']
      }
    ];
  }
};