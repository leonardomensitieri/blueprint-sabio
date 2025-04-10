import { db } from './config';
import { 
  doc, 
  setDoc, 
  collection, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

/**
 * Configura a estrutura de dados financeiros para um usuário.
 * @param {string} userId - ID do usuário no Firebase
 */
export const setupUserFinancialData = async (userId, userData = {}) => {
  if (!userId) {
    console.error('ID de usuário não fornecido!');
    return false;
  }
  
  try {
    console.log(`Configurando estrutura de dados para o usuário ${userId}...`);
    
    // 1. Verificar/atualizar o documento principal do usuário
    const userRef = doc(db, 'users', userId);
    
    // Dados mínimos do usuário
    const userDataToSet = {
      updatedAt: serverTimestamp(),
      ...userData
    };
    
    // Atualizar o documento do usuário
    await updateDoc(userRef, userDataToSet);
    console.log('Documento principal do usuário atualizado.');
    
    // 2. Criar a subcoleção financialData com o documento main
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    
    // Estrutura completa conforme solicitado
    await setDoc(financialDataRef, {
      updatedAt: serverTimestamp(),
      poderDeAporte: 1000,
      custoDeVidaMensal: 3000,
      
      // Estrutura para patrimônio em ações
      patrimonioAcoes: {
        total: 0,
        tickers: {
          // Exemplo de ação PETR4
          "PETR4": {
            quantidadeAcoes: 100,
            cotacao: 36.75,
            ultimaAtualizacao: serverTimestamp()
          },
          // Exemplo de ação VALE3
          "VALE3": {
            quantidadeAcoes: 50,
            cotacao: 68.20,
            ultimaAtualizacao: serverTimestamp()
          }
        }
      },
      
      // Estrutura para patrimônio em renda fixa
      patrimonioRendaFixa: {
        total: 10000,
        tempoInvestido: "1-2"
      },
      
      // Estrutura para reserva de emergência
      patrimonioReservaDeEmergencia: {
        total: 15000,
        empregoEstavelConcursado: false,
        pjAutonomo: true
      },
      
      // Patrimônio total calculado
      patrimonioTotal: 10000 + 15000 + (100 * 36.75) + (50 * 68.20)
    });
    
    console.log('Estrutura de dados financeiros criada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao configurar dados financeiros:', error);
    return false;
  }
};

/**
 * Adiciona ou atualiza uma ação na carteira do usuário usando a estrutura solicitada
 * @param {string} userId - ID do usuário
 * @param {object} stockData - Dados da ação (ticker, quantidade, cotacao)
 */
export const addStockToPortfolio = async (userId, stockData) => {
  if (!userId || !stockData || !stockData.ticker) {
    console.error('Dados insuficientes para adicionar ação à carteira.');
    return false;
  }
  
  try {
    console.log(`Adicionando/atualizando ação ${stockData.ticker} para usuário ${userId}...`);
    
    // Referência ao documento financeiro
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    
    // Preparar dados da ação
    const quantidade = parseInt(stockData.quantidade || 0);
    const cotacao = parseFloat(stockData.cotacao || 0);
    const valorTotal = quantidade * cotacao;
    
    // Estrutura a ser atualizada
    const updateData = {
      [`patrimonioAcoes.tickers.${stockData.ticker}`]: {
        quantidadeAcoes: quantidade,
        cotacao: cotacao,
        ultimaAtualizacao: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    };
    
    // Atualizar documento
    await updateDoc(financialDataRef, updateData);
    
    // Agora precisamos recalcular o total do patrimônio em ações e o patrimônio total
    // Isso requer uma leitura seguida de uma escrita
    
    console.log(`Ação ${stockData.ticker} adicionada/atualizada com sucesso!`);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar ação à carteira:', error);
    return false;
  }
};

/**
 * Configuração completa da estrutura para um usuário específico
 * @param {string} userId - ID do usuário
 */
export const setupCompleteStructure = async (userId) => {
  if (!userId) {
    console.error('ID de usuário não fornecido para configuração!');
    return false;
  }
  
  try {
    console.log(`Iniciando configuração completa para usuário ${userId}...`);
    
    // 1. Configurar dados financeiros básicos
    const financialSetupSuccess = await setupUserFinancialData(userId);
    
    if (!financialSetupSuccess) {
      console.error('Falha ao configurar dados financeiros!');
      return false;
    }
    
    console.log('Configuração completa realizada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro durante configuração completa:', error);
    return false;
  }
};

// Exportar função principal para uso externo
export default setupCompleteStructure; 