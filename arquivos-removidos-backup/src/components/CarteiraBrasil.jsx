import React, { useState, useEffect } from 'react';
import { useAuth } from './auth/AuthProvider';
import { 
  doc, 
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import '../styles/CarteiraBrasil.css';

// Função auxiliar para obter a carteira do usuário diretamente do Firestore
const fetchUserPortfolio = async (userId) => {
  console.log(`[DEBUG] Fetching portfolio for user: ${userId}`);
  
  try {
    // Verificar se o documento de usuário existe
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    console.log(`[DEBUG] User document exists: ${userDoc.exists()}`);
    
    // Se o documento existe, tentar obter a subcoleção financialData
    if (userDoc.exists()) {
      console.log(`[DEBUG] User data:`, userDoc.data());
      
      // Obter o documento main da subcoleção financialData
      const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
      const financialDoc = await getDoc(financialDataRef);
      console.log(`[DEBUG] Financial document exists: ${financialDoc.exists()}`);
      
      if (financialDoc.exists()) {
        const financialData = financialDoc.data();
        console.log(`[DEBUG] Financial data:`, financialData);
        
        // Verificar se temos patrimonioAcoes e tickers
        if (financialData.patrimonioAcoes && financialData.patrimonioAcoes.tickers) {
          const tickers = financialData.patrimonioAcoes.tickers;
          console.log(`[DEBUG] Found ${Object.keys(tickers).length} stocks in portfolio`);
          
          // Converter para array para usar no componente
          const stocksArray = Object.entries(tickers).map(([ticker, data]) => {
            const quantidade = data.quantidadeAcoes || 0;
            const cotacao = data.cotacao || 0;
            const valorTotal = quantidade * cotacao;
            const dividendoPorAcaoProjetado = data.dividendoPorAcaoProjetado || cotacao * 0.04; // estimativa de 4% de dividend yield
            
            return {
              id: ticker,
              ticker: ticker,
              quantidade: quantidade,
              cotacao: cotacao,
              capitalAlocado: valorTotal,
              dividendoPorAcaoProjetado: dividendoPorAcaoProjetado,
              rendaAnual: quantidade * dividendoPorAcaoProjetado,
              dividendYield: cotacao > 0 ? (dividendoPorAcaoProjetado / cotacao) * 100 : 0,
              ultimaAtualizacao: data.ultimaAtualizacao?.toDate() || new Date()
            };
          });
          
          console.log(`[DEBUG] Processed stocks:`, stocksArray);
          return stocksArray;
        } else {
          console.log(`[DEBUG] No patrimonioAcoes or tickers found in financial data`);
          return [];
        }
      } else {
        console.log(`[DEBUG] No financial document found, creating one...`);
        
        // Se não houver documento financialData, criar um
        await setDoc(financialDataRef, {
          poderDeAporte: 0,
          custoDeVidaMensal: 0,
          patrimonioAcoes: { total: 0, tickers: {} },
          patrimonioRendaFixa: { total: 0, tempoInvestido: '0-6' },
          patrimonioReservaDeEmergencia: { total: 0 },
          patrimonioTotal: 0,
          updatedAt: serverTimestamp()
        });
        
        return [];
      }
    } else {
      console.log(`[DEBUG] User document does not exist`);
      return [];
    }
  } catch (error) {
    console.error(`[ERROR] Error fetching portfolio:`, error);
    throw error;
  }
};

// Função auxiliar para salvar uma ação na carteira
const saveStock = async (userId, stockData) => {
  console.log(`[DEBUG] Saving stock for user ${userId}:`, stockData);
  
  try {
    // Obter o documento financialData
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const financialDoc = await getDoc(financialDataRef);
    
    if (!financialDoc.exists()) {
      console.log(`[DEBUG] Financial document doesn't exist, creating it`);
      await setDoc(financialDataRef, {
        poderDeAporte: 0,
        custoDeVidaMensal: 0,
        patrimonioAcoes: { total: 0, tickers: {} },
        patrimonioRendaFixa: { total: 0, tempoInvestido: '0-6' },
        patrimonioReservaDeEmergencia: { total: 0 },
        patrimonioTotal: 0,
        updatedAt: serverTimestamp()
      });
    }
    
    // Preparar dados da ação
    const ticker = stockData.ticker.toUpperCase();
    const quantidade = parseInt(stockData.quantidade) || 0;
    const cotacao = parseFloat(stockData.cotacao) || 0;
    const valorTotal = quantidade * cotacao;
    
    // Buscar dados atualizados após possível criação
    const updatedDoc = await getDoc(financialDataRef);
    const financialData = updatedDoc.data();
    
    // Verificar se a estrutura existe
    let patrimonioAcoes = financialData.patrimonioAcoes || { total: 0, tickers: {} };
    let tickers = patrimonioAcoes.tickers || {};
    
    // Atualizar ou adicionar ticker
    tickers[ticker] = {
      quantidadeAcoes: quantidade,
      cotacao: cotacao,
      ultimaAtualizacao: serverTimestamp()
    };
    
    // Calcular novo total
    let totalAcoes = 0;
    Object.entries(tickers).forEach(([_, data]) => {
      totalAcoes += (data.quantidadeAcoes || 0) * (data.cotacao || 0);
    });
    
    // Calcular patrimônio total
    const rendaFixaTotal = financialData.patrimonioRendaFixa?.total || 0;
    const emergenciaTotal = financialData.patrimonioReservaDeEmergencia?.total || 0;
    const patrimonioTotal = totalAcoes + rendaFixaTotal + emergenciaTotal;
    
    // Atualizar documento
    await updateDoc(financialDataRef, {
      'patrimonioAcoes.tickers': tickers,
      'patrimonioAcoes.total': totalAcoes,
      patrimonioTotal: patrimonioTotal,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[DEBUG] Stock ${ticker} saved successfully`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error saving stock:`, error);
    throw error;
  }
};

// Função auxiliar para remover uma ação da carteira
const removeStock = async (userId, ticker) => {
  console.log(`[DEBUG] Removing stock ${ticker} for user ${userId}`);
  
  try {
    // Obter o documento financialData
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const financialDoc = await getDoc(financialDataRef);
    
    if (!financialDoc.exists()) {
      console.log(`[DEBUG] Financial document doesn't exist`);
      return false;
    }
    
    const financialData = financialDoc.data();
    
    // Verificar se o ticker existe
    if (!financialData.patrimonioAcoes?.tickers?.[ticker]) {
      console.log(`[DEBUG] Ticker ${ticker} not found in portfolio`);
      return false;
    }
    
    // Criar cópia dos tickers sem o ticker a ser removido
    const tickers = { ...financialData.patrimonioAcoes.tickers };
    delete tickers[ticker];
    
    // Calcular novo total
    let totalAcoes = 0;
    Object.entries(tickers).forEach(([_, data]) => {
      totalAcoes += (data.quantidadeAcoes || 0) * (data.cotacao || 0);
    });
    
    // Calcular patrimônio total
    const rendaFixaTotal = financialData.patrimonioRendaFixa?.total || 0;
    const emergenciaTotal = financialData.patrimonioReservaDeEmergencia?.total || 0;
    const patrimonioTotal = totalAcoes + rendaFixaTotal + emergenciaTotal;
    
    // Atualizar documento
    await updateDoc(financialDataRef, {
      'patrimonioAcoes.tickers': tickers,
      'patrimonioAcoes.total': totalAcoes,
      patrimonioTotal: patrimonioTotal,
      updatedAt: serverTimestamp()
    });
    
    console.log(`[DEBUG] Stock ${ticker} removed successfully`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error removing stock:`, error);
    throw error;
  }
};

// Função auxiliar para obter dados financeiros
const fetchFinancialData = async (userId) => {
  console.log(`[DEBUG] Fetching financial data for user: ${userId}`);
  
  try {
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const financialDoc = await getDoc(financialDataRef);
    
    if (financialDoc.exists()) {
      const data = financialDoc.data();
      console.log(`[DEBUG] Financial data found:`, data);
      
      return {
        poderAporteMensal: data.poderDeAporte || 0,
        custoVidaMensal: data.custoDeVidaMensal || 0
      };
    } else {
      console.log(`[DEBUG] No financial data found, returning defaults`);
      return {
        poderAporteMensal: 0,
        custoVidaMensal: 0
      };
    }
  } catch (error) {
    console.error(`[ERROR] Error fetching financial data:`, error);
    throw error;
  }
};

// Função auxiliar para atualizar dados financeiros
const updateFinancialData = async (userId, data) => {
  console.log(`[DEBUG] Updating financial data for user ${userId}:`, data);
  
  try {
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    const financialDoc = await getDoc(financialDataRef);
    
    if (financialDoc.exists()) {
      await updateDoc(financialDataRef, {
        poderDeAporte: data.poderAporteMensal || 0,
        custoDeVidaMensal: data.custoVidaMensal || 0,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(financialDataRef, {
        poderDeAporte: data.poderAporteMensal || 0,
        custoDeVidaMensal: data.custoVidaMensal || 0,
        patrimonioAcoes: { total: 0, tickers: {} },
        patrimonioRendaFixa: { total: 0, tempoInvestido: '0-6' },
        patrimonioReservaDeEmergencia: { total: 0 },
        patrimonioTotal: 0,
        updatedAt: serverTimestamp()
      });
    }
    
    console.log(`[DEBUG] Financial data updated successfully`);
    return true;
  } catch (error) {
    console.error(`[ERROR] Error updating financial data:`, error);
    throw error;
  }
};

const CarteiraBrasil = () => {
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    ticker: '',
    quantidade: '',
    cotacao: ''
  });
  const [financialData, setFinancialData] = useState({
    poderAporteMensal: 0,
    custoVidaMensal: 0
  });
  const [showFinancialForm, setShowFinancialForm] = useState(false);

  // Buscar carteira ao carregar o componente
  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) {
      console.log("[DEBUG] No current user, cannot load data");
      return;
    }
    
    console.log(`[DEBUG] Loading data for user: ${currentUser.uid}, ${currentUser.email}`);
    setLoading(true);
    
    try {
      // Buscar carteira
      const userPortfolio = await fetchUserPortfolio(currentUser.uid);
      setPortfolio(userPortfolio);
      
      // Buscar dados financeiros
      const userData = await fetchFinancialData(currentUser.uid);
      setFinancialData(userData);
      
      setError(null);
    } catch (err) {
      console.error("[ERROR] Error loading user data:", err);
      setError("Não foi possível carregar sua carteira de ações. Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gerenciar dados do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Adicionar ação à carteira
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!formData.ticker || !formData.quantidade || !formData.cotacao) {
      setError("Preencha todos os campos");
      return;
    }
    
    try {
      setLoading(true);
      
      // Adicionar ação ao Firestore
      await saveStock(currentUser.uid, formData);
      
      // Recarregar carteira
      const updatedPortfolio = await fetchUserPortfolio(currentUser.uid);
      setPortfolio(updatedPortfolio);
      
      // Limpar formulário
      setFormData({
        ticker: '',
        quantidade: '',
        cotacao: ''
      });
      
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error("[ERROR] Error adding stock:", err);
      setError("Falha ao adicionar ação. Por favor, tente novamente. Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remover ação da carteira
  const handleRemoveStock = async (ticker) => {
    if (!window.confirm(`Tem certeza que deseja remover ${ticker} da sua carteira?`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Remover ação do Firestore
      await removeStock(currentUser.uid, ticker);
      
      // Recarregar carteira
      const updatedPortfolio = await fetchUserPortfolio(currentUser.uid);
      setPortfolio(updatedPortfolio);
      
      setError(null);
    } catch (err) {
      console.error("[ERROR] Error removing stock:", err);
      setError("Falha ao remover ação. Por favor, tente novamente. Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados financeiros
  const handleSaveFinancialData = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Atualizar dados financeiros no Firestore
      await updateFinancialData(currentUser.uid, financialData);
      
      setShowFinancialForm(false);
      setError(null);
    } catch (err) {
      console.error("[ERROR] Error saving financial data:", err);
      setError("Falha ao salvar dados financeiros. Por favor, tente novamente. Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totais
  const calculateTotals = () => {
    let totalCapital = 0;
    let totalDividendos = 0;
    
    portfolio.forEach(stock => {
      totalCapital += stock.capitalAlocado;
      totalDividendos += stock.rendaAnual;
    });
    
    const dividendYieldMedio = totalCapital > 0 ? (totalDividendos / totalCapital) * 100 : 0;
    
    return {
      totalCapital,
      totalDividendos,
      dividendYieldMedio,
      mesesParaLiberdade: financialData.custoVidaMensal > 0 
        ? Math.ceil((financialData.custoVidaMensal * 12) / totalDividendos) 
        : 0
    };
  };

  const totals = calculateTotals();

  return (
    <div className="carteira-brasil-container">
      <h1>Minha Carteira de Ações</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <div className="loading-container">
          <p>Carregando carteira...</p>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* Resumo financeiro */}
          <div className="financial-summary">
            <div className="summary-card">
              <h3>Capital Total</h3>
              <p>R$ {totals.totalCapital.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Dividendos Anuais</h3>
              <p>R$ {totals.totalDividendos.toFixed(2)}</p>
            </div>
            <div className="summary-card">
              <h3>Yield Médio</h3>
              <p>{totals.dividendYieldMedio.toFixed(2)}%</p>
            </div>
            <div className="summary-card">
              <h3>Poder de Aporte</h3>
              <p>R$ {financialData.poderAporteMensal.toFixed(2)}/mês</p>
            </div>
          </div>
          
          {/* Progresso para FIRE */}
          <div className="fire-progress">
            <h2>Progresso para Independência Financeira</h2>
            <div className="progress-container">
              <div className="progress-info">
                <div>
                  <strong>Custo de vida mensal:</strong> R$ {financialData.custoVidaMensal.toFixed(2)}
                </div>
                <div>
                  <strong>Dividendos mensais:</strong> R$ {(totals.totalDividendos / 12).toFixed(2)}
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${Math.min(100, (totals.totalDividendos / 12) / financialData.custoVidaMensal * 100 || 0)}%` 
                  }}
                ></div>
              </div>
              
              <div className="progress-percentage">
                {financialData.custoVidaMensal > 0 
                  ? `${Math.min(100, ((totals.totalDividendos / 12) / financialData.custoVidaMensal * 100)).toFixed(1)}%` 
                  : '0%'}
              </div>
            </div>
            
            <p className="fire-target">
              {financialData.custoVidaMensal > 0 
                ? `Com os dividendos atuais, você atingirá a independência financeira em aproximadamente ${totals.mesesParaLiberdade} meses, mantendo o ritmo atual de aportes.`
                : 'Configure seu custo de vida mensal para calcular seu tempo até a independência financeira.'}
            </p>
            
            <button 
              className="config-button"
              onClick={() => setShowFinancialForm(true)}
            >
              Configurar Dados Financeiros
            </button>
          </div>
          
          {/* Tabela de ações */}
          <div className="portfolio-section">
            <div className="section-header">
              <h2>Ações na Carteira</h2>
              <button 
                className="add-button"
                onClick={() => setShowAddForm(true)}
              >
                Adicionar Ação
              </button>
            </div>
            
            {portfolio.length === 0 ? (
              <p>Você ainda não tem ações na carteira. Adicione sua primeira ação!</p>
            ) : (
              <div className="table-responsive">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Quantidade</th>
                      <th>Cotação (R$)</th>
                      <th>Capital (R$)</th>
                      <th>Div/Ação (R$)</th>
                      <th>Div. Anual (R$)</th>
                      <th>Yield (%)</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map(stock => (
                      <tr key={stock.ticker}>
                        <td>{stock.ticker}</td>
                        <td>{stock.quantidade}</td>
                        <td>{stock.cotacao.toFixed(2)}</td>
                        <td>{stock.capitalAlocado.toFixed(2)}</td>
                        <td>{stock.dividendoPorAcaoProjetado.toFixed(2)}</td>
                        <td>{stock.rendaAnual.toFixed(2)}</td>
                        <td>{stock.dividendYield.toFixed(2)}%</td>
                        <td>
                          <button 
                            className="remove-button"
                            onClick={() => handleRemoveStock(stock.ticker)}
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Modal para adicionar ação */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Adicionar Ação</h2>
            <form onSubmit={handleAddStock}>
              <div className="form-group">
                <label htmlFor="ticker">Ticker:</label>
                <input
                  type="text"
                  id="ticker"
                  name="ticker"
                  value={formData.ticker}
                  onChange={handleChange}
                  placeholder="Ex: PETR4"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quantidade">Quantidade:</label>
                <input
                  type="number"
                  id="quantidade"
                  name="quantidade"
                  value={formData.quantidade}
                  onChange={handleChange}
                  placeholder="Ex: 100"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cotacao">Cotação (R$):</label>
                <input
                  type="number"
                  id="cotacao"
                  name="cotacao"
                  value={formData.cotacao}
                  onChange={handleChange}
                  placeholder="Ex: 28.50"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit">Salvar</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal para dados financeiros */}
      {showFinancialForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Configurar Dados Financeiros</h2>
            <form onSubmit={handleSaveFinancialData}>
              <div className="form-group">
                <label htmlFor="poderAporteMensal">Poder de Aporte Mensal (R$):</label>
                <input
                  type="number"
                  id="poderAporteMensal"
                  name="poderAporteMensal"
                  value={financialData.poderAporteMensal}
                  onChange={(e) => setFinancialData({
                    ...financialData,
                    poderAporteMensal: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Ex: 1000"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="custoVidaMensal">Custo de Vida Mensal (R$):</label>
                <input
                  type="number"
                  id="custoVidaMensal"
                  name="custoVidaMensal"
                  value={financialData.custoVidaMensal}
                  onChange={(e) => setFinancialData({
                    ...financialData,
                    custoVidaMensal: parseFloat(e.target.value) || 0
                  })}
                  placeholder="Ex: 3000"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit">Salvar</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowFinancialForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Informações de depuração */}
      <div className="debug-info" style={{ marginTop: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
        <h3>Informações de Depuração</h3>
        <p><strong>Status de autenticação:</strong> {currentUser ? `Autenticado como ${currentUser.email} (${currentUser.uid})` : 'Não autenticado'}</p>
        <p><strong>Status de carregamento:</strong> {loading ? 'Carregando...' : 'Concluído'}</p>
        <p><strong>Itens na carteira:</strong> {portfolio.length}</p>
        <p><strong>Erro:</strong> {error || 'Nenhum'}</p>
        <button 
          onClick={loadUserData} 
          style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Recarregar Dados
        </button>
      </div>
    </div>
  );
};

export default CarteiraBrasil; 