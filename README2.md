Implementação Consistente do Dashboard Financeiro
Vou organizar uma solução completa baseada na nova estrutura de dados proposta, com todos os arquivos necessários e implementações consistentes.

1. Estrutura de Dados do Firestore
A nova estrutura utiliza um documento principal para dados financeiros ao invés de várias subcoleções:

users (coleção)
└── {userId} (documento)
     ├── name: string
     ├── email: string
     ├── phone: string
     ├── lives_abroad: boolean
     ├── how_found: string
     ├── age: number
     ├── created_at: timestamp
     ├── occupation: string
     ├── income: number
     ├── patrimony: number           // patrimônio total informado pelo usuário (geral)
     ├── message: string
     ├── life_insurance: boolean
     ├── patrimony_priority: string
     ├── income_priority: string
     ├── email_sent: boolean
     ├── hasActiveSubscription: boolean
     ├── role: string
     ├── updatedAt: timestamp
     └── financialData (subcoleção)
          └── main (documento)
               ├── updatedAt: timestamp
               ├── poderDeAporte: number
               ├── custoDeVidaMensal: number
               ├── patrimonioAcoes (objeto)
               │    ├── total: number
               │    └── tickers (objeto)
               │         ├── {Ticker} (ex.: "BBAS3")
               │         │    └── quantidadeAcoes: number
               │         └── ... (outros tickers)
               ├── patrimonioRendaFixa (objeto)
               │    ├── total: number
               │    └── tempoInvestido: string
               ├── patrimonioReservaDeEmergencia


----------------

2. Função do Firebase para Inicialização de Usuário

// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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
    hasActiveSubscription: false,
    role: 'user',
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



3. Serviço de Usuário (TypeScript)

// src/services/userService.ts

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/functions';

// Interfaces para tipagem
export interface User {
  name: string;
  email: string;
  phone: string;
  lives_abroad: boolean;
  how_found: string;
  age: number;
  created_at: firebase.firestore.Timestamp;
  occupation: string;
  income: number;
  patrimony: number;
  message: string;
  life_insurance: boolean;
  patrimony_priority: string;
  income_priority: string;
  email_sent: boolean;
  hasActiveSubscription: boolean;
  role: string;
  updatedAt: firebase.firestore.Timestamp;
}

export interface TickerInfo {
  quantidadeAcoes: number;
  precoMedio?: number;
  dividendoProjetado?: number;
  valor?: number;
}

export interface FinancialData {
  updatedAt: firebase.firestore.Timestamp;
  poderDeAporte: number;
  custoDeVidaMensal: number;
  patrimonioAcoes: {
    total: number;
    tickers: {
      [ticker: string]: TickerInfo;
    };
  };
  patrimonioRendaFixa: {
    total: number;
    tempoInvestido: string;
  };
  patrimonioReservaDeEmergencia: {
    total: number;
  };
}

// Referência ao Firestore
const db = firebase.firestore();

// ====== SERVIÇOS DE USUÁRIO ======

/**
 * Obtém os dados do usuário
 */
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await db
      .collection('users')
      .doc(userId)
      .get();
    
    return userDoc.exists ? (userDoc.data() as User) : null;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    throw error;
  }
};

/**
 * Atualiza os dados do usuário
 */
export const updateUser = async (
  userId: string,
  dadosAtualizados: Partial<User>
): Promise<void> => {
  try {
    await db
      .collection('users')
      .doc(userId)
      .update({
        ...dadosAtualizados,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Erro ao atualizar dados do usuário:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE DADOS FINANCEIROS ======

/**
 * Obtém os dados financeiros do usuário
 */
export const getFinancialData = async (userId: string): Promise<FinancialData | null> => {
  try {
    const financialDoc = await db
      .collection('users')
      .doc(userId)
      .collection('financialData')
      .doc('main')
      .get();
    
    return financialDoc.exists ? (financialDoc.data() as FinancialData) : null;
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error);
    throw error;
  }
};

/**
 * Atualiza os dados financeiros básicos do usuário
 */
export const updateFinancialData = async (
  userId: string,
  dadosAtualizados: {
    poderDeAporte?: number;
    custoDeVidaMensal?: number;
  }
): Promise<void> => {
  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('financialData')
      .doc('main')
      .update({
        ...dadosAtualizados,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Erro ao atualizar dados financeiros:', error);
    throw error;
  }
};

// ====== SERVIÇOS DE AÇÕES ======

/**
 * Obtém todas as ações do usuário
 */
export const getAcoes = async (userId: string): Promise<{ ticker: string, info: TickerInfo }[]> => {
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
  userId: string, 
  ticker: string, 
  infoAcao: TickerInfo
): Promise<void> => {
  try {
    // Normalize o ticker para ID (remova pontos e torne maiúsculo)
    const tickerId = ticker.replace('.', '_').toUpperCase();
    
    // Calcular valor total
    const valor = infoAcao.quantidadeAcoes * (infoAcao.precoMedio || 0);
    
    // Buscar dados financeiros atuais
    const financialData = await getFinancialData(userId);
    if (!financialData) {
      throw new Error('Dados financeiros não encontrados');
    }
    
    // Usar transaction para garantir atomicidade
    await db.runTransaction(async (transaction) => {
      const financialRef = db
        .collection('users')
        .doc(userId)
        .collection('financialData')
        .doc('main');
      
      // Adicionar a nova ação ao objeto tickers
      transaction.update(financialRef, {
        [`patrimonioAcoes.tickers.${tickerId}`]: {
          ...infoAcao,
          valor,
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Atualizar os totais
    await atualizarTotaisFinanceiros(userId);
  } catch (error) {
    console.error('Erro ao adicionar ação:', error);
    throw error;
  }
};

/**
 * Remove uma ação da carteira do usuário
 */
export const removerAcao = async (userId: string, ticker: string): Promise<void> => {
  try {
    // Normalize o ticker para ID
    const tickerId = ticker.replace('.', '_').toUpperCase();
    
    await db.runTransaction(async (transaction) => {
      const financialRef = db
        .collection('users')
        .doc(userId)
        .collection('financialData')
        .doc('main');
      
      // Remover a ação do objeto tickers
      transaction.update(financialRef, {
        [`patrimonioAcoes.tickers.${tickerId}`]: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
  userId: string,
  ticker: string,
  infoAtualizada: Partial<TickerInfo>
): Promise<void> => {
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
    
    await db
      .collection('users')
      .doc(userId)
      .collection('financialData')
      .doc('main')
      .update({
        [`patrimonioAcoes.tickers.${tickerId}`]: novaInfo,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    
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
  userId: string,
  dadosRendaFixa: {
    total: number;
    tempoInvestido: string;
  }
): Promise<void> => {
  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('financialData')
      .doc('main')
      .update({
        'patrimonioRendaFixa': dadosRendaFixa,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    
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
  userId: string,
  dadosReserva: {
    total: number;
  }
): Promise<void> => {
  try {
    await db
      .collection('users')
      .doc(userId)
      .collection('financialData')
      .doc('main')
      .update({
        'patrimonioReservaDeEmergencia': dadosReserva,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    
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
export const atualizarTotaisFinanceiros = async (userId: string): Promise<void> => {
  try {
    const updateTotals = firebase.functions().httpsCallable('updateFinancialTotals');
    await updateTotals();
  } catch (error) {
    console.error('Erro ao atualizar totais financeiros:', error);
    throw error;
  }
};





4. Componente de Carteira de Ações

// src/components/dashboard/StockPortfolio.tsx

import React, { useState, useEffect } from 'react';
import { getAcoes, adicionarAcao, removerAcao, atualizarAcao, TickerInfo } from '../../services/userService';

interface StockPortfolioProps {
  userId: string;
}

interface AcaoDisplay {
  ticker: string;
  quantidadeAcoes: number;
  precoMedio?: number;
  valor?: number;
  dividendoProjetado?: number;
}

const StockPortfolio: React.FC<StockPortfolioProps> = ({ userId }) => {
  const [acoes, setAcoes] = useState<AcaoDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para nova ação
  const [novaAcao, setNovaAcao] = useState({
    ticker: '',
    quantidadeAcoes: 0,
    precoMedio: 0,
    dividendoProjetado: 0
  });

  // Buscar ações ao carregar componente
  useEffect(() => {
    const carregarAcoes = async () => {
      try {
        setLoading(true);
        setError(null);
        const acoesData = await getAcoes(userId);
        
        // Transformar dados para formato de exibição
        const acoesDisplay = acoesData.map(({ ticker, info }) => ({
          ticker,
          quantidadeAcoes: info.quantidadeAcoes,
          precoMedio: info.precoMedio,
          valor: info.valor,
          dividendoProjetado: info.dividendoProjetado
        }));
        
        setAcoes(acoesDisplay);
      } catch (err) {
        console.error('Erro ao carregar ações:', err);
        setError('Não foi possível carregar sua carteira de ações. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      carregarAcoes();
    }
  }, [userId]);

  // Handler para mudanças nos inputs do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNovaAcao(prev => ({
      ...prev,
      [name]: name === 'ticker' ? value.toUpperCase() : parseFloat(value) || 0
    }));
  };

  // Adicionar nova ação
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !novaAcao.ticker) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Transformar para o formato esperado pela API
      const tickerInfo: TickerInfo = {
        quantidadeAcoes: novaAcao.quantidadeAcoes,
        precoMedio: novaAcao.precoMedio,
        dividendoProjetado: novaAcao.dividendoProjetado
      };
      
      await adicionarAcao(userId, novaAcao.ticker, tickerInfo);
      
      // Limpar formulário
      setNovaAcao({
        ticker: '',
        quantidadeAcoes: 0,
        precoMedio: 0,
        dividendoProjetado: 0
      });
      
      // Recarregar lista de ações
      const acoesData = await getAcoes(userId);
      const acoesDisplay = acoesData.map(({ ticker, info }) => ({
        ticker,
        quantidadeAcoes: info.quantidadeAcoes,
        precoMedio: info.precoMedio,
        valor: info.valor,
        dividendoProjetado: info.dividendoProjetado
      }));
      
      setAcoes(acoesDisplay);
      setError(null);
    } catch (err) {
      console.error('Erro ao adicionar ação:', err);
      setError('Ocorreu um erro ao adicionar a ação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Remover ação
  const handleRemoveStock = async (ticker: string) => {
    if (!userId) return;
    
    if (!window.confirm('Tem certeza que deseja remover esta ação?')) return;
    
    try {
      setLoading(true);
      await removerAcao(userId, ticker);
      
      // Atualizar lista de ações localmente (otimista)
      setAcoes(prevAcoes => prevAcoes.filter(acao => acao.ticker !== ticker));
      
      setError(null);
    } catch (err) {
      console.error('Erro ao remover ação:', err);
      setError('Ocorreu um erro ao remover a ação. Tente novamente.');
      
      // Recarregar lista de ações em caso de erro
      const acoesData = await getAcoes(userId);
      const acoesDisplay = acoesData.map(({ ticker, info }) => ({
        ticker,
        quantidadeAcoes: info.quantidadeAcoes,
        precoMedio: info.precoMedio,
        valor: info.valor,
        dividendoProjetado: info.dividendoProjetado
      }));
      
      setAcoes(acoesDisplay);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-portfolio">
      <h2>Carteira de Ações</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="add-stock-form">
        <form onSubmit={handleAddStock}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticker">Código da Ação</label>
              <input
                type="text"
                id="ticker"
                name="ticker"
                value={novaAcao.ticker}
                onChange={handleInputChange}
                placeholder="BBAS3"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantidadeAcoes">Quantidade</label>
              <input
                type="number"
                id="quantidadeAcoes"
                name="quantidadeAcoes"
                value={novaAcao.quantidadeAcoes || ''}
                onChange={handleInputChange}
                min="1"
                step="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="precoMedio">Preço Médio (R$)</label>
              <input
                type="number"
                id="precoMedio"
                name="precoMedio"
                value={novaAcao.precoMedio || ''}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dividendoProjetado">Dividendo Anual/Ação (R$)</label>
              <input
                type="number"
                id="dividendoProjetado"
                name="dividendoProjetado"
                value={novaAcao.dividendoProjetado || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
            
            <button 
              type="submit" 
              className="add-button"
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Ação'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Resumo do Portfolio */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total de Ações</h3>
          <p>{acoes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Valor Total</h3>
          <p>
            R$ {acoes.reduce((total, acao) => 
              total + ((acao.valor || acao.quantidadeAcoes * (acao.precoMedio || 0)) || 0), 0
            ).toFixed(2)}
          </p>
        </div>
        <div className="summary-card">
          <h3>Dividendos Anuais</h3>
          <p>
            R$ {acoes.reduce((total, acao) => 
              total + ((acao.dividendoProjetado || 0) * acao.quantidadeAcoes), 0
            ).toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Tabela de Ações */}
      <div className="stocks-table-container">
        <h3>Minhas Ações</h3>
        
        {loading && acoes.length === 0 ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Carregando sua carteira...</p>
          </div>
        ) : acoes.length === 0 ? (
          <div className="empty-portfolio">
            <p>Você ainda não possui ações na sua carteira.</p>
            <p>Adicione sua primeira ação utilizando o formulário acima.</p>
          </div>
        ) : (
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Quantidade</th>
                <th>Preço Médio</th>
                <th>Total Investido</th>
                <th>Div. Projetado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {acoes.map(acao => (
                <tr key={acao.ticker}>
                  <td>{acao.ticker}</td>
                  <td>{acao.quantidadeAcoes}</td>
                  <td>R$ {acao.precoMedio?.toFixed(2) || '0.00'}</td>
                  <td>
                    R$ {acao.valor?.toFixed(2) || 
                      (acao.quantidadeAcoes * (acao.precoMedio || 0)).toFixed(2)}
                  </td>
                  <td>
                    {acao.dividendoProjetado 
                      ? `R$ ${(acao.dividendoProjetado * acao.quantidadeAcoes).toFixed(2)}` 
                      : '-'}
                  </td>
                  <td>
                    <button 
                      className="remove-button" 
                      onClick={() => handleRemoveStock(acao.ticker)}
                      title="Remover ação"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Ações em lote (opcional) */}
      <div className="refresh-section">
        <div>
          <button 
            className="refresh-button"
            disabled={loading || acoes.length === 0}
            onClick={async () => {
              try {
                setLoading(true);
                const acoesData = await getAcoes(userId);
                const acoesDisplay = acoesData.map(({ ticker, info }) => ({
                  ticker,
                  quantidadeAcoes: info.quantidadeAcoes,
                  precoMedio: info.precoMedio,
                  valor: info.valor,
                  dividendoProjetado: info.dividendoProjetado
                }));
                setAcoes(acoesDisplay);
              } catch (err) {
                setError('Erro ao atualizar dados.');
              } finally {
                setLoading(false);
              }
            }}
          >
            Atualizar Dados
          </button>
        </div>
        
        <div className="last-update">
          Última atualização: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default StockPortfolio;




5. Integração com o provedor de autenticação (AuthProvider)

// src/components/auth/AuthProvider.js

import React, { useState, useEffect, createContext, useContext } from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// Criar contexto de autenticação
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitorar alterações no estado de autenticação
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // Buscar perfil do usuário no Firestore
          const userDoc = await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .get();

          if (userDoc.exists) {
            setUserProfile(userDoc.data());
          }
          
          // Atualizar o timestamp de último acesso
          await firebase.firestore()
            .collection('users')
            .doc(user.uid)
            .update({
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
          // Limpar dados do usuário quando deslogar
          setUserProfile(null);
        }
        
        setCurrentUser(user);
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Função para registro de novo usuário
  const signup = async (email, password, userData) => {
    try {
      // Firebase irá criar o usuário na autenticação
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // A função Cloud que configuramos será acionada automaticamente
      // para criar o documento do usuário e dados financeiros iniciais
      
      // Podemos também atualizar os dados adicionais
      if (userData) {
        await firebase.firestore()
          .collection('users')
          .doc(result.user.uid)
          .update({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  };

  // Função para login
  const login = async (email, password) => {
    try {
      return await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  // Função para logout
  const logout = async () => {
    try {
      return await firebase.auth().signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  // Função para reset de senha
  const resetPassword = async (email) => {
    try {
      return await firebase.auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      throw error;
    }
  };

  // Função para atualizar perfil do usuário
  const updateProfile = async (data) => {
    if (!currentUser) throw new Error('Nenhum usuário logado');
    
    try {
      await firebase.firestore()
        .collection('users')
        .doc(currentUser.uid)
        .update({
          ...data,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      
      // Atualizar estado local
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...data
      }));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  // Valores expostos pelo contexto
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



6. Regras de Segurança do Firestore


// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função auxiliar para verificar se o usuário está autenticado
    function isAutenticado() {
      return request.auth != null;
    }
    
    // Função auxiliar para verificar se o usuário é dono do documento
    function isDono(userId) {
      return isAutenticado() && request.auth.uid == userId;
    }
    
    // Função auxiliar para verificar se o usuário é admin
    function isAdmin() {
      return isAutenticado() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Permitir acesso aos documentos de usuário apenas para o próprio usuário
    match /users/{userId} {
      allow get, update: if isDono(userId);
      allow list, create, delete: if isAdmin();
      
      // Dados financeiros - apenas o usuário pode ler/escrever
      match /financialData/{docId} {
        allow read, write: if isDono(userId);
      }
    }
    
    // Configurações globais - apenas admin pode escrever, todos podem ler
    match /configuracoes/{docId} {
      allow read: if isAutenticado();
      allow write: if isAdmin();
    }
    
    // Dados de produtos - todos podem ler, apenas admin pode escrever
    match /produtos/{produtoId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Dados públicos de análise - todos podem ler
    match /analises/{analiseId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Dados de tickers - todos podem ler
    match /tickers/{tickerId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}



7. Como Integrar no Projeto Existente
Para integrar esse sistema no projeto existente, você precisará seguir os seguintes passos:
Passo 1: Faça um backup do projeto atual
Sempre crie um backup antes de fazer grandes mudanças:

# Clonar para uma pasta de backup
cp -r blueprint-sabio blueprint-sabio-backup

npm install -g firebase-tools
firebase login
firebase init functions


Passo 3: Adicione os códigos nos arquivos apropriados

Adicione o código da função Cloud ao arquivo functions/index.js
Crie o arquivo src/services/userService.ts com o código fornecido
Crie o componente src/components/dashboard/StockPortfolio.tsx
Atualize o seu arquivo AuthProvider.js existente (ou crie um, se não existir)

Passo 4: Atualize as regras do Firestore

# Copie as regras para o arquivo firestore.rules
firebase deploy --only firestore:rules

Passo 5: Implante as funções do Firebase
firebase deploy --only functions

Passo 6: Integre o componente de carteira no seu Dashboard
Atualize o arquivo principal do Dashboard para incluir o novo componente:

// Em src/components/dashboard/Dashboard.js ou similar
import StockPortfolio from './StockPortfolio';

// ... dentro do seu componente
<StockPortfolio userId={currentUser.uid} />

8. Futuras Implementações
Esta estrutura pode ser expandida facilmente para incluir os outros recursos planejados:

Projeção de Dividendos: Pode usar os mesmos dados de ações para calcular projeções
Gestão de Renda Fixa: A estrutura para armazenar dados já foi criada
Reserva de Emergência: Também já tem estrutura preparada
Carteira Consolidada: Pode combinar todos os dados financeiros

9. Considerações Finais
Esta implementação oferece várias vantagens:

Estrutura Organizada: Uma estrutura clara para armazenar dados de usuário e financeiros
Expandível: Facilmente expansível para incluir novos tipos de dados
Eficiente: Os dados são armazenados de forma otimizada para consultas frequentes
Segura: As regras de segurança garantem que apenas usuários autorizados possam acessar seus dados
Integrável: Se integra ao sistema existente de autenticação e pagamentos

Com esta base sólida, você pode construir as demais funcionalidades do dashboard financeiro de forma consistente e escalável.
Se precisar de auxílio com alguma funcionalidade específica ou detalhes de implementação, estou à disposição para ajudar!