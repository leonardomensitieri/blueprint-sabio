import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { 
  saveStockToPortfolio, 
  removeStockFromPortfolio, 
  getUserPortfolio,
  updateUserFinancialData,
  getAvailableStocks,
  getUserFinancialData
} from '../../firebase/db';
import { fetchStockPrice } from '../../services/financialAPI';
import { 
  formatCurrency, 
  formatPercentage, 
  calculatePortfolioSummary 
} from '../../services/financialCalculations';
import './CarteiraBrasil.css';

/**
 * Componente de Carteira Individual de Ações
 * Implementa as funcionalidades da fase 1 conforme especificado
 */
const CarteiraBrasil = () => {
  const { currentUser } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [newStock, setNewStock] = useState({ ticker: '', quantidade: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [error, setError] = useState('');
  const [userFinancialData, setUserFinancialData] = useState({
    poderAporteMensal: 0,
    custoVidaMensal: 0
  });
  const [summaryData, setSummaryData] = useState({
    totalValue: 0,
    totalAnnualIncome: 0,
    totalMonthlyIncome: 0,
    averageYield: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);

  // Usar a função real da API para buscar preços
  const getStockPrice = async (ticker) => {
    try {
      // Usar a API real implementada em financialAPI.js
      const price = await fetchStockPrice(ticker);
      console.log(`Preço obtido para ${ticker}:`, price);
      return price;
    } catch (error) {
      console.error(`Erro ao buscar preço para ${ticker}:`, error);
      // Valores de fallback para casos de erro
      const fallbackPrices = {
        'PETR4': 36.75,
        'VALE3': 68.20,
        'ITUB4': 32.40,
        'BBDC4': 17.85,
        'ABEV3': 14.92,
        'BBAS3': 52.31,
        'MGLU3': 4.25,
        'WEGE3': 41.30,
        'RADL3': 23.67,
        'RENT3': 65.40,
      };
      
      return fallbackPrices[ticker] || parseFloat((Math.random() * 50 + 10).toFixed(2));
    }
  };
  
  // Carregar carteira do usuário
  const loadPortfolio = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Carregando carteira para o usuário:', currentUser.uid);
      
      // Buscar ações da carteira usando a nova estrutura
      const userStocks = await getUserPortfolio(currentUser.uid);
      console.log('Ações retornadas pelo Firebase:', userStocks);
      
      if (!userStocks || userStocks.length === 0) {
        setStocks([]);
        setIsLoading(false);
        return;
      }
      
      // Ações já vêm com os campos calculados da nova estrutura
      setStocks(userStocks);
      updateSummary(userStocks);
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
      setError('Não foi possível carregar sua carteira de ações.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Carregar ações disponíveis (para sugestões)
  const loadAvailableStocks = useCallback(async () => {
    try {
      console.log('Carregando ações disponíveis...');
      const stocksList = await getAvailableStocks();
      console.log('Ações disponíveis carregadas:', stocksList);
      setAvailableStocks(stocksList || []);
    } catch (error) {
      console.error('Erro ao carregar lista de ações:', error);
      // Criar lista mockada para desenvolvimento
      setAvailableStocks([
        { ticker: 'PETR4', nome: 'Petrobras PN', dividendoPorAcaoEstimado: 2.8 },
        { ticker: 'VALE3', nome: 'Vale ON', dividendoPorAcaoEstimado: 3.5 },
        { ticker: 'ITUB4', nome: 'Itaú Unibanco PN', dividendoPorAcaoEstimado: 1.2 },
        { ticker: 'BBDC4', nome: 'Bradesco PN', dividendoPorAcaoEstimado: 0.8 },
        { ticker: 'ABEV3', nome: 'Ambev ON', dividendoPorAcaoEstimado: 0.65 }
      ]);
    }
  }, []);

  // Carregar dados financeiros do usuário
  const loadUserFinancialData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Carregando dados financeiros para o usuário:', currentUser.uid);
      // Usar a nova função para buscar dados financeiros
      const userData = await getUserFinancialData(currentUser.uid);
      console.log('Dados financeiros do usuário:', userData);
      
      if (userData) {
        setUserFinancialData({
          poderAporteMensal: userData.poderAporteMensal || 0,
          custoVidaMensal: userData.custoVidaMensal || 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      // Valores padrão para desenvolvimento
      setUserFinancialData({
        poderAporteMensal: 1000,
        custoVidaMensal: 3000
      });
    }
  }, [currentUser]);

  // Carregar dados iniciais
  useEffect(() => {
    console.log('Iniciando carregamento de dados...');
    if (currentUser) {
      loadPortfolio();
      loadAvailableStocks();
      loadUserFinancialData();
    }
  }, [currentUser, loadPortfolio, loadAvailableStocks, loadUserFinancialData]);

  // Atualizar resumo da carteira
  const updateSummary = (stocksData) => {
    if (!stocksData || stocksData.length === 0) {
      setSummaryData({
        totalValue: 0,
        totalAnnualIncome: 0,
        totalMonthlyIncome: 0,
        averageYield: 0
      });
      return;
    }
    
    const totalValue = stocksData.reduce((sum, stock) => sum + (stock.capitalAlocado || 0), 0);
    const totalAnnualIncome = stocksData.reduce((sum, stock) => sum + (stock.rendaAnual || 0), 0);
    const totalMonthlyIncome = totalAnnualIncome / 12;
    
    // Cálculo do dividend yield médio da carteira (ponderado pelo capital alocado)
    let averageYield = 0;
    if (totalValue > 0) {
      averageYield = (totalAnnualIncome / totalValue) * 100;
    }
    
    setSummaryData({
      totalValue,
      totalAnnualIncome,
      totalMonthlyIncome,
      averageYield
    });
  };

  // Adicionar ou atualizar ação na carteira
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Você precisa estar logado para adicionar ações.');
      return;
    }
    
    if (!newStock.ticker || !newStock.quantidade) {
      setError('Preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Adicionando ação à carteira:', newStock);
      const ticker = newStock.ticker.toUpperCase();
      const quantidade = parseInt(newStock.quantidade);
      
      // Buscar preço atual da ação (usando API real)
      const currentPrice = await getStockPrice(ticker);
      console.log(`Preço obtido para ${ticker}:`, currentPrice);
      
      // Buscar dividendo por ação projetado (dados fundamentais ou estimativa)
      let dividendoPorAcaoProjetado = 0;
      
      // Verificar se existe nos dados fundamentais
      const stockFundamentalData = availableStocks.find(stock => stock.ticker === ticker);
      if (stockFundamentalData) {
        dividendoPorAcaoProjetado = stockFundamentalData.dividendoPorAcaoEstimado || 0;
      } else {
        // Usar estimativa baseada no DY médio do mercado (4%)
        dividendoPorAcaoProjetado = currentPrice * 0.04;
      }
      
      // Preparar dados da ação
      const stockData = {
        ticker,
        quantidade,
        cotacao: currentPrice,
        dividendoPorAcaoProjetado,
        ultimaAtualizacao: new Date()
      };
      
      console.log('Dados a serem salvos:', stockData);
      console.log('Usuário ID:', currentUser.uid);
      
      // Salvar na base de dados usando a nova estrutura
      await saveStockToPortfolio(currentUser.uid, stockData);
      console.log('Ação salva com sucesso!');
      
      // Limpar formulário
      setNewStock({ ticker: '', quantidade: '' });
      
      // Recarregar carteira
      await loadPortfolio();
      
      // Fechar modal
      setShowAddModal(false);
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      setError('Não foi possível adicionar a ação à carteira.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remover ação da carteira
  const handleRemoveStock = async (ticker) => {
    if (!currentUser) return;
    
    if (!window.confirm(`Tem certeza que deseja remover a ação ${ticker} da carteira?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Removendo ação:', ticker);
      // Usar o ticker como ID na nova estrutura
      await removeStockFromPortfolio(currentUser.uid, ticker);
      console.log('Ação removida com sucesso!');
      
      // Recarregar carteira
      await loadPortfolio();
    } catch (error) {
      console.error('Erro ao remover ação:', error);
      setError('Não foi possível remover a ação da carteira.');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar cotações
  const handleUpdatePrices = async () => {
    if (!stocks || stocks.length === 0) return;
    
    setIsUpdatingPrices(true);
    setError('');
    
    try {
      console.log('Atualizando cotações...');
      
      // Para cada ação na carteira
      for (const stock of stocks) {
        // Buscar preço atualizado usando a API real
        const currentPrice = await getStockPrice(stock.ticker);
        console.log(`Novo preço para ${stock.ticker}:`, currentPrice);
        
        // Atualizar na base de dados
        await saveStockToPortfolio(currentUser.uid, {
          ticker: stock.ticker,
          quantidade: stock.quantidade,
          cotacao: currentPrice,
          dividendoPorAcaoProjetado: stock.dividendoPorAcaoProjetado
        });
      }
      
      // Recarregar carteira com preços atualizados
      await loadPortfolio();
      console.log('Cotações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
      setError('Não foi possível atualizar as cotações.');
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  // Salvar dados financeiros do usuário
  const handleSaveFinancialData = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      console.log('Salvando dados financeiros:', userFinancialData);
      await updateUserFinancialData(currentUser.uid, userFinancialData);
      console.log('Dados financeiros salvos com sucesso!');
      setShowFinancialModal(false);
    } catch (error) {
      console.error('Erro ao salvar dados financeiros:', error);
      setError('Não foi possível salvar seus dados financeiros.');
    }
  };

  // Renderizar formulário de adição de ação
  const renderAddStockModal = () => {
    return (
      <div className={`modal ${showAddModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Adicionar Ação</h3>
            <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
          </div>
          <form onSubmit={handleAddStock}>
            <div className="form-group">
              <label htmlFor="ticker">Ticker</label>
              <input
                type="text"
                id="ticker"
                placeholder="Ex: PETR4"
                value={newStock.ticker}
                onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })}
                list="tickers-list"
              />
              <datalist id="tickers-list">
                {availableStocks.map(stock => (
                  <option key={stock.ticker} value={stock.ticker} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade</label>
              <input
                type="number"
                id="quantidade"
                placeholder="Ex: 100"
                value={newStock.quantidade}
                onChange={(e) => setNewStock({ ...newStock, quantidade: e.target.value })}
                min="1"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowAddModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Renderizar formulário de dados financeiros
  const renderFinancialDataModal = () => {
    return (
      <div className={`modal ${showFinancialModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Dados Financeiros</h3>
            <button className="close-button" onClick={() => setShowFinancialModal(false)}>×</button>
          </div>
          <form onSubmit={handleSaveFinancialData}>
            <div className="form-group">
              <label htmlFor="poderAporteMensal">Poder de Aporte Mensal (R$)</label>
              <input
                type="number"
                id="poderAporteMensal"
                placeholder="Ex: 1000"
                value={userFinancialData.poderAporteMensal}
                onChange={(e) => setUserFinancialData({ 
                  ...userFinancialData, 
                  poderAporteMensal: parseFloat(e.target.value) 
                })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="custoVidaMensal">Custo de Vida Mensal (R$)</label>
              <input
                type="number"
                id="custoVidaMensal"
                placeholder="Ex: 3000"
                value={userFinancialData.custoVidaMensal}
                onChange={(e) => setUserFinancialData({ 
                  ...userFinancialData, 
                  custoVidaMensal: parseFloat(e.target.value) 
                })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={() => setShowFinancialModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="primary-button">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="carteira-brasil">
      <h2>Carteira de Ações</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Resumo da Carteira */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Patrimônio Total</h3>
          <p>{formatCurrency(summaryData.totalValue)}</p>
        </div>
        <div className="summary-card">
          <h3>Renda Anual</h3>
          <p>{formatCurrency(summaryData.totalAnnualIncome)}</p>
        </div>
        <div className="summary-card">
          <h3>Renda Mensal Média</h3>
          <p>{formatCurrency(summaryData.totalMonthlyIncome)}</p>
        </div>
        <div className="summary-card">
          <h3>Dividend Yield Médio</h3>
          <p>{formatPercentage(summaryData.averageYield)}</p>
        </div>
      </div>
      
      {/* Ações da Carteira */}
      <div className="portfolio-actions">
        <button 
          className="primary-button" 
          onClick={() => setShowAddModal(true)}
          disabled={isLoading}
        >
          Adicionar Ação
        </button>
        <button 
          className="secondary-button" 
          onClick={handleUpdatePrices}
          disabled={isUpdatingPrices || stocks.length === 0}
        >
          {isUpdatingPrices ? 'Atualizando...' : 'Atualizar Cotações'}
        </button>
        <button 
          className="secondary-button" 
          onClick={() => setShowFinancialModal(true)}
        >
          Dados Financeiros
        </button>
      </div>
      
      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando carteira...</p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="empty-portfolio">
          <p>Sua carteira está vazia. Adicione ações para começar a acompanhar seu desempenho.</p>
          <button 
            className="primary-button" 
            onClick={() => setShowAddModal(true)}
          >
            Adicionar Primeira Ação
          </button>
        </div>
      ) : (
        <div className="stocks-table-container">
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Quantidade</th>
                <th>Cotação</th>
                <th>Capital</th>
                <th>Div/Ação</th>
                <th>Renda Anual</th>
                <th>Yield</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(stock => (
                <tr key={stock.id}>
                  <td>{stock.ticker}</td>
                  <td>{stock.quantidade}</td>
                  <td>{formatCurrency(stock.cotacao)}</td>
                  <td>{formatCurrency(stock.capitalAlocado)}</td>
                  <td>{formatCurrency(stock.dividendoPorAcaoProjetado)}</td>
                  <td>{formatCurrency(stock.rendaAnual)}</td>
                  <td className={getYieldColorClass(stock.dividendYield)}>
                    {formatPercentage(stock.dividendYield)}
                  </td>
                  <td>
                    <button 
                      className="remove-button" 
                      onClick={() => handleRemoveStock(stock.ticker)}
                      title="Remover ação"
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {renderAddStockModal()}
      {renderFinancialDataModal()}
    </div>
  );
};

// Função auxiliar para determinar a classe de cor com base no dividend yield
const getYieldColorClass = (yield_) => {
  if (yield_ >= 7) return 'high-yield';
  if (yield_ >= 4) return 'medium-yield';
  return 'low-yield';
};

export default CarteiraBrasil; 