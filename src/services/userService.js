import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  serverTimestamp,
  runTransaction,
  deleteField,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// ====== SERVIÇOS DE USUÁRIO ======

/**
 * Obtém os dados do usuário
 */
export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    throw error;
  }
};

/**
 * Atualiza os dados do usuário
 */
export const updateUser = async (userId, dadosAtualizados) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...dadosAtualizados,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE DADOS FINANCEIROS ======

/**
 * Obtém os dados financeiros do usuário
 * Se o documento não existir, inicializa a estrutura básica
 */
export const getFinancialData = async (userId) => {
  try {
    const financialRef = doc(db, 'users', userId, 'financialData', 'main');
    const financialDoc = await getDoc(financialRef);
    
    // Se o documento existe, retornar seus dados
    if (financialDoc.exists()) {
      return financialDoc.data();
    }
    
    // Se não existe, criar a estrutura básica
    console.log('Inicializando estrutura de dados financeiros...');
    const now = serverTimestamp();
    const defaultData = {
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
    
    // Salvar o documento
    await setDoc(financialRef, defaultData);
    
    // Retornar os dados iniciais
    return {
      ...defaultData,
      updatedAt: new Date() // Substituir o serverTimestamp por um Date para o retorno
    };
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    throw error;
  }
};

/**
 * Atualiza os dados financeiros básicos do usuário
 */
export const updateFinancialData = async (
  userId,
  dadosAtualizados
) => {
  try {
    await updateDoc(
      doc(db, 'users', userId, 'financialData', 'main'),
      {
        ...dadosAtualizados,
        updatedAt: serverTimestamp()
      }
    );
  } catch (error) {
    console.error('Erro ao atualizar dados financeiros:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE AÇÕES ======

/**
 * Obtém todas as ações do usuário
 */
export const getAcoes = async (userId) => {
  try {
    const financialData = await getFinancialData(userId);
    if (!financialData) {
      return [];
    }
    
    const tickers = financialData.patrimonioAcoes?.tickers || {};
    return Object.entries(tickers).map(([ticker, info]) => ({
      ticker,
      info
    }));
  } catch (error) {
    console.error('Erro ao buscar ações:', error);
    throw error;
  }
};

/**
 * Adiciona uma nova ação à carteira do usuário
 */
export const adicionarAcao = async (
  userId, 
  ticker, 
  infoAcao
) => {
  try {
    // Normalize o ticker para ID (remova pontos e torne maiúsculo)
    const tickerId = ticker.replace('.', '_').toUpperCase();
    
    // Calcular valor total
    const valor = infoAcao.quantidadeAcoes * (infoAcao.precoMedio || 0);
    
    // Referência ao documento de dados financeiros
    const financialRef = doc(db, 'users', userId, 'financialData', 'main');
    
    // Verificar se o documento existe
    const financialDoc = await getDoc(financialRef);
    
    // Se não existir, vamos criar com a estrutura básica
    if (!financialDoc.exists()) {
      console.log('Inicializando estrutura de dados financeiros...');
      await setDoc(financialRef, {
        updatedAt: serverTimestamp(),
        poderDeAporte: 0,
        custoDeVidaMensal: 0,
        patrimonioAcoes: {
          total: 0,
          tickers: {
            [tickerId]: {
              ...infoAcao,
              valor,
            }
          }
        },
        patrimonioRendaFixa: {
          total: 0,
          tempoInvestido: ''
        },
        patrimonioReservaDeEmergencia: {
          total: 0
        }
      });
    } else {
      // Se existir, usar transaction para atualizar
      await runTransaction(db, async (transaction) => {
        // Adicionar a nova ação ao objeto tickers
        transaction.update(financialRef, {
          [`patrimonioAcoes.tickers.${tickerId}`]: {
            ...infoAcao,
            valor,
          },
          updatedAt: serverTimestamp()
        });
      });
    }
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
    
    // Salvar localmente para caso a Cloud Function falhe
    try {
      // Buscar dados atualizados
      const updatedDoc = await getDoc(financialRef);
      const data = updatedDoc.data();
      
      // Calcular total de ações manualmente
      let totalAcoes = 0;
      const tickers = data.patrimonioAcoes?.tickers || {};
      
      Object.keys(tickers).forEach(ticker => {
        const tickerData = tickers[ticker];
        totalAcoes += (tickerData.valor || tickerData.quantidadeAcoes * (tickerData.precoMedio || 0));
      });
      
      // Atualizar total de ações
      await updateDoc(financialRef, {
        'patrimonioAcoes.total': totalAcoes,
        updatedAt: serverTimestamp()
      });
      
      // Atualizar patrimônio total no documento principal
      const totalRendaFixa = data.patrimonioRendaFixa?.total || 0;
      const totalReservaEmergencia = data.patrimonioReservaDeEmergencia?.total || 0;
      const patrimonioTotal = totalAcoes + totalRendaFixa + totalReservaEmergencia;
      
      await updateDoc(doc(db, 'users', userId), {
        patrimony: patrimonioTotal,
        updatedAt: serverTimestamp()
      });
    } catch (backupError) {
      console.warn('Erro ao executar cálculo local de backup:', backupError);
      // Não interrompe a execução se o backup falhar
    }
    
  } catch (error) {
    console.error('Erro ao adicionar ação:', error);
    throw error;
  }
};

/**
 * Remove uma ação da carteira do usuário
 */
export const removerAcao = async (userId, ticker) => {
  try {
    // Normalize o ticker para ID
    const tickerId = ticker.replace('.', '_').toUpperCase();
    
    await runTransaction(db, async (transaction) => {
      const financialRef = doc(db, 'users', userId, 'financialData', 'main');
      
      // Remover a ação do objeto tickers
      transaction.update(financialRef, {
        [`patrimonioAcoes.tickers.${tickerId}`]: deleteField(),
        updatedAt: serverTimestamp()
      });
    });
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
  } catch (error) {
    console.error('Erro ao remover ação:', error);
    throw error;
  }
};

/**
 * Atualiza uma ação existente na carteira do usuário
 */
export const atualizarAcao = async (
  userId,
  ticker,
  infoAtualizada
) => {
  try {
    // Normalize o ticker para ID
    const tickerId = ticker.replace('.', '_').toUpperCase();
    
    // Buscar dados financeiros atuais
    const financialData = await getFinancialData(userId);
    if (!financialData) {
      throw new Error('Dados financeiros não encontrados');
    }
    
    // Verificar se a ação existe
    const tickerAtual = financialData.patrimonioAcoes?.tickers?.[tickerId];
    if (!tickerAtual) {
      throw new Error('Ação não encontrada na carteira');
    }
    
    // Mesclar dados atuais com dados atualizados
    const novaInfo = {
      ...tickerAtual,
      ...infoAtualizada
    };
    
    // Calcular valor total se necessário
    if (infoAtualizada.quantidadeAcoes || infoAtualizada.precoMedio) {
      novaInfo.valor = novaInfo.quantidadeAcoes * (novaInfo.precoMedio || 0);
    }
    
    await updateDoc(
      doc(db, 'users', userId, 'financialData', 'main'),
      {
        [`patrimonioAcoes.tickers.${tickerId}`]: novaInfo,
        updatedAt: serverTimestamp()
      }
    );
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
  } catch (error) {
    console.error('Erro ao atualizar ação:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE RENDA FIXA ======

/**
 * Atualiza os dados de renda fixa do usuário
 */
export const atualizarRendaFixa = async (
  userId,
  dadosRendaFixa
) => {
  try {
    await updateDoc(
      doc(db, 'users', userId, 'financialData', 'main'),
      {
        'patrimonioRendaFixa': dadosRendaFixa,
        updatedAt: serverTimestamp()
      }
    );
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
  } catch (error) {
    console.error('Erro ao atualizar renda fixa:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE RESERVA DE EMERGÊNCIA ======

/**
 * Atualiza os dados de reserva de emergência do usuário
 */
export const atualizarReservaEmergencia = async (
  userId,
  dadosReserva
) => {
  try {
    await updateDoc(
      doc(db, 'users', userId, 'financialData', 'main'),
      {
        'patrimonioReservaDeEmergencia': dadosReserva,
        updatedAt: serverTimestamp()
      }
    );
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
  } catch (error) {
    console.error('Erro ao atualizar reserva de emergência:', error);
    throw error;
  }
};

// ====== FUNÇÕES AUXILIARES ======

/**
 * Atualiza todos os totais financeiros do usuário
 * Chama a função cloud para fazer este cálculo no servidor
 */
export const atualizarTotaisFinanceiros = async (userId) => {
  try {
    // Primeiro, tentamos atualizar via Cloud Function
    try {
      const updateTotals = httpsCallable(functions, 'updateFinancialTotals');
      await updateTotals();
    } catch (cloudError) {
      console.warn('Não foi possível atualizar via Cloud Function. Fazendo atualização local:', cloudError);
      
      // Fallback: Atualização local se a função cloud falhar
      const financialData = await getFinancialData(userId);
      if (!financialData) return;
      
      // Calcular totais de ações
      let totalAcoes = 0;
      const tickers = financialData.patrimonioAcoes?.tickers || {};
      
      Object.keys(tickers).forEach(ticker => {
        const tickerData = tickers[ticker];
        totalAcoes += (tickerData.valor || 
                      tickerData.quantidadeAcoes * (tickerData.precoMedio || 0));
      });
      
      // Atualizar documento de dados financeiros
      await updateDoc(
        doc(db, 'users', userId, 'financialData', 'main'),
        {
          'patrimonioAcoes.total': totalAcoes,
          updatedAt: serverTimestamp()
        }
      );
      
      // Atualizar o documento principal do usuário
      const totalRendaFixa = financialData.patrimonioRendaFixa?.total || 0;
      const totalReservaEmergencia = financialData.patrimonioReservaDeEmergencia?.total || 0;
      const patrimonioTotal = totalAcoes + totalRendaFixa + totalReservaEmergencia;
      
      await updateDoc(
        doc(db, 'users', userId),
        {
          patrimony: patrimonioTotal,
          updatedAt: serverTimestamp()
        }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar totais financeiros:', error);
    throw error;
  }
};